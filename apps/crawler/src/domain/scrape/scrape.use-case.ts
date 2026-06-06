import { ApplicationLayer, logger } from '@repo/core/log';
import { ListingSchema, type ListingInput } from '../model/listing.model.js';
import {
  type Neighborhood,
  type TransactionType,
  buildNeighborhoodUrl,
} from '../model/neighborhood.model.js';
import type { SiteParser } from '../../parsers/base.parser.js';
import { RateLimiter, type RateLimiterConfig } from './rate-limiter.js';
import { RetryStrategy } from './retry.strategy.js';
import { PaginationStrategy } from './pagination.strategy.js';
import { BrowserClient } from '../../data/browser/browser.client.js';
import { HumanBehavior } from '../../data/browser/human-behavior.js';
import { RawHtmlStorage } from '../../data/storage/raw-html.storage.js';
import { ListingsDbDatasource } from '../../data/listings/listings.db.datasource.js';
import { ScrapeJobsDbDatasource } from '../../data/scrape-jobs/scrape-jobs.db.datasource.js';

const log = { layer: ApplicationLayer.Domain, method: 'scrape' };

export interface ScrapeResult {
  jobId: string;
  listingsFound: number;
  listingsCreated: number;
  listingsUpdated: number;
  errors: { url: string; error: string }[];
}

export interface ScrapeOptions {
  neighborhoods: Neighborhood[];
  transactionType: TransactionType;
  rateLimiterConfig?: Partial<RateLimiterConfig>;
  maxPagesPerNeighborhood?: number;
}

async function scrapeNeighborhood(
  parser: SiteParser,
  neighborhood: Neighborhood,
  transaction: TransactionType,
  jobId: string,
  pageCounter: { value: number },
  rateLimiter: ReturnType<typeof RateLimiter.create>,
  retry: ReturnType<typeof RetryStrategy.create>,
  maxPages: number,
): Promise<{ listings: ListingInput[]; errors: { url: string; error: string }[] }> {
  const url = buildNeighborhoodUrl(neighborhood, transaction);
  const listings: ListingInput[] = [];
  const errors: { url: string; error: string }[] = [];

  try {
    logger.info({ ...log, message: `Scraping ${neighborhood.name} (${transaction}): ${url}` });

    const html = await retry.execute(async () => {
      await rateLimiter.wait();

      if (rateLimiter.needsSessionRotation()) {
        await BrowserClient.rotateContext();
        rateLimiter.resetCount();
      }

      const page = await BrowserClient.newPage();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
        await HumanBehavior.shortPause(page);
        await PaginationStrategy.loadAllListings(page, maxPages);
        return await PaginationStrategy.getPageHtml(page);
      } finally {
        await page.close();
      }
    }, `neighborhood:${neighborhood.slug}`);

    pageCounter.value++;
    await RawHtmlStorage.save(parser.source, jobId, pageCounter.value, html);

    const parsed = parser.parseListings(html);
    listings.push(...parsed);

    logger.info({
      ...log,
      message: `Found ${parsed.length} listings in ${neighborhood.name}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ ...log, message: `Failed to scrape ${neighborhood.name}: ${message}`, error });
    errors.push({ url, error: message });
  }

  return { listings, errors };
}

async function persistListings(
  listings: ListingInput[],
): Promise<{ created: number; updated: number; errors: number }> {
  let created = 0;
  let updated = 0;
  let persistErrors = 0;

  for (const listing of listings) {
    const validation = ListingSchema.safeParse(listing);
    if (!validation.success) {
      logger.warn({ ...log, message: `Invalid listing ${listing.sourceId}: ${validation.error.message}` });
      persistErrors++;
      continue;
    }

    try {
      const existing = await ListingsDbDatasource.findBySourceId(listing.source, listing.sourceId);
      await ListingsDbDatasource.upsert(validation.data);
      if (existing) {
        updated++;
      } else {
        created++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ ...log, message: `Failed to persist listing ${listing.sourceId}: ${message}`, error });
      persistErrors++;
    }
  }

  return { created, updated, errors: persistErrors };
}

export async function executeScrape(parser: SiteParser, options: ScrapeOptions): Promise<ScrapeResult> {
  const job = await ScrapeJobsDbDatasource.create({ source: parser.source });
  const jobId = job.id;

  await ScrapeJobsDbDatasource.update(jobId, { status: 'running', startedAt: new Date() });
  logger.info({ ...log, message: `Job ${jobId} started: ${options.neighborhoods.length} neighborhoods, type=${options.transactionType}` });

  const rateLimiter = RateLimiter.create(options.rateLimiterConfig);
  const retry = RetryStrategy.create();
  const pageCounter = { value: 0 };
  const allListings: ListingInput[] = [];
  const allErrors: { url: string; error: string }[] = [];

  for (const neighborhood of options.neighborhoods) {
    const result = await scrapeNeighborhood(
      parser,
      neighborhood,
      options.transactionType,
      jobId,
      pageCounter,
      rateLimiter,
      retry,
      options.maxPagesPerNeighborhood ?? 100,
    );

    allListings.push(...result.listings);
    allErrors.push(...result.errors);

    await ScrapeJobsDbDatasource.update(jobId, {
      pagesScraped: pageCounter.value,
      listingsFound: allListings.length,
      errors: allErrors.length,
    });
  }

  logger.info({ ...log, message: `Scraping complete, persisting ${allListings.length} listings...` });
  const persistResult = await persistListings(allListings);

  const finalStatus = allErrors.length > 0 && allListings.length === 0 ? 'failed' : 'completed';

  await ScrapeJobsDbDatasource.update(jobId, {
    status: finalStatus,
    listingsFound: allListings.length,
    listingsCreated: persistResult.created,
    listingsUpdated: persistResult.updated,
    errors: allErrors.length + persistResult.errors,
    errorLog: allErrors.length > 0 ? { errors: allErrors } : null,
    completedAt: new Date(),
  });

  logger.info({
    ...log,
    message: `Job ${jobId} ${finalStatus}: ${allListings.length} found, ${persistResult.created} created, ${persistResult.updated} updated, ${allErrors.length + persistResult.errors} errors`,
  });

  return {
    jobId,
    listingsFound: allListings.length,
    listingsCreated: persistResult.created,
    listingsUpdated: persistResult.updated,
    errors: allErrors,
  };
}
