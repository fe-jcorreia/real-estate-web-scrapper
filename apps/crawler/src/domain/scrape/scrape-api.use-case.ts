import { ApplicationLayer, logger } from '@repo/core/log';
import { QuintoAndarApiClient, type BusinessContext } from '../../data/api/quintoandar-api.client.js';
import { ViaCepClient } from '../../data/api/viacep.client.js';
import { RawPageStorage } from '../../data/storage/raw-page.storage.js';
import { ListingsDbDatasource } from '../../data/listings/listings.db.datasource.js';
import { ScrapeJobsDbDatasource } from '../../data/scrape-jobs/scrape-jobs.db.datasource.js';
import { generateBuckets } from '../model/search-bucket.model.js';
import { ListingSchema, type ListingInput } from '../model/listing.model.js';
import { parseEsHits } from '../../parsers/quintoandar-api.parser.js';
import { RateLimiter } from './rate-limiter.js';
import { RetryStrategy } from './retry.strategy.js';
import { Env } from '../../env/index.js';

const log = { layer: ApplicationLayer.Domain, method: 'scrape-api' };

async function enrichWithViaCep(listings: ListingInput[]): Promise<void> {
  const ceps = new Set<string>();
  for (const l of listings) {
    if (l.zipCode) ceps.add(l.zipCode);
  }

  const lookups = new Map<string, Awaited<ReturnType<typeof ViaCepClient.lookup>>>();

  for (const cep of ceps) {
    const result = await ViaCepClient.lookup(cep);
    lookups.set(cep, result);
  }

  for (const listing of listings) {
    if (!listing.zipCode) continue;
    const data = lookups.get(listing.zipCode);
    if (!data) continue;
    listing.neighborhood = data.neighborhood;
    listing.city = data.city;
    listing.state = data.state;
  }

  logger.info({ ...log, message: `Enriched ${listings.length} listings from ${ceps.size} unique CEPs (cache: ${ViaCepClient.getCacheSize()})` });
}

export async function executeScrapeApi(): Promise<void> {
  const businessContext: BusinessContext = Env.TRANSACTION_TYPE === 'sale' ? 'SALE' : 'RENT';
  const buckets = generateBuckets(businessContext);
  const client = QuintoAndarApiClient.create();
  const rateLimiter = RateLimiter.create({
    baseDelayMs: Env.REQUEST_DELAY_MS,
    batchSize: Env.BATCH_SIZE,
    batchPauseMs: Env.BATCH_PAUSE_MS,
    maxPagesPerSession: Env.MAX_REQUESTS_PER_SESSION,
  });
  const retry = RetryStrategy.create();

  const job = await ScrapeJobsDbDatasource.create({ source: 'quintoandar' });
  await ScrapeJobsDbDatasource.update(job.id, { status: 'running', startedAt: new Date() });

  logger.info({ ...log, message: `Job ${job.id} started: ${buckets.length} buckets for ${businessContext}` });

  let totalListingsFound = 0;
  let totalListingsCreated = 0;
  let totalListingsUpdated = 0;
  let totalErrors = 0;
  let bucketsProcessed = 0;
  const errorLog: Record<string, unknown>[] = [];

  try {
    for (const bucket of buckets) {
      bucketsProcessed++;
      logger.info({ ...log, message: `[${bucketsProcessed}/${buckets.length}] Processing bucket: ${bucket.label}` });

      try {
        const { hits, total } = await retry.execute(
          () => client.search({
            businessContext: bucket.businessContext,
            bedrooms: bucket.bedrooms,
            bathrooms: bucket.bathrooms,
          }),
          bucket.label,
        );

        if (hits.length === 0) {
          logger.info({ ...log, message: `Bucket ${bucket.label}: 0 results (total: ${total})` });
          await rateLimiter.wait();
          continue;
        }

        await RawPageStorage.saveJson('quintoandar', job.id, bucket.label, hits);

        const listings = parseEsHits(hits, bucket.businessContext);
        totalListingsFound += listings.length;

        await enrichWithViaCep(listings);

        for (const listing of listings) {
          try {
            const parsed = ListingSchema.parse(listing);
            const existing = await ListingsDbDatasource.findBySourceId(parsed.source, parsed.sourceId);
            await ListingsDbDatasource.upsert(parsed);
            if (existing) {
              totalListingsUpdated++;
            } else {
              totalListingsCreated++;
            }
          } catch (err) {
            totalErrors++;
            logger.warn({ ...log, message: `Failed to persist listing ${listing.sourceId}: ${err}` });
            if (errorLog.length < 100) {
              errorLog.push({ sourceId: listing.sourceId, error: String(err) });
            }
          }
        }

        logger.info({
          ...log,
          message: `Bucket ${bucket.label}: ${listings.length} listings processed (total available: ${total})`,
        });
      } catch (err) {
        totalErrors++;
        logger.error({ ...log, message: `Bucket ${bucket.label} failed: ${err}`, error: err });
        errorLog.push({ bucket: bucket.label, error: String(err) });
      }

      await rateLimiter.wait();

      if (rateLimiter.needsSessionRotation()) {
        client.session.rotate();
        rateLimiter.resetCount();
      }
    }

    await ScrapeJobsDbDatasource.update(job.id, {
      status: 'completed',
      pagesScraped: bucketsProcessed,
      listingsFound: totalListingsFound,
      listingsCreated: totalListingsCreated,
      listingsUpdated: totalListingsUpdated,
      errors: totalErrors,
      errorLog: errorLog.length > 0 ? { errors: errorLog } : null,
      completedAt: new Date(),
    });

    logger.info({
      ...log,
      message: `Job ${job.id} completed: ${totalListingsFound} found, ${totalListingsCreated} created, ${totalListingsUpdated} updated, ${totalErrors} errors`,
    });
  } catch (err) {
    await ScrapeJobsDbDatasource.update(job.id, {
      status: 'failed',
      pagesScraped: bucketsProcessed,
      listingsFound: totalListingsFound,
      listingsCreated: totalListingsCreated,
      listingsUpdated: totalListingsUpdated,
      errors: totalErrors + 1,
      errorLog: { errors: [...errorLog, { fatal: String(err) }] },
      completedAt: new Date(),
    });

    logger.error({ ...log, message: `Job ${job.id} failed fatally: ${err}`, error: err });
    throw err;
  }
}
