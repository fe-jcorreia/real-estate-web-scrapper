import { ApplicationLayer, logger } from '@repo/core/log';
import { configureCrawler, shutdownCrawler } from './crawler.config.js';
import { createQuintoAndarParser } from './parsers/index.js';
import { executeScrape } from './domain/scrape/scrape.use-case.js';
import { SAO_PAULO_NEIGHBORHOODS } from './domain/model/neighborhood.model.js';
import { Env } from './env/index.js';

const log = { layer: ApplicationLayer.Domain, method: 'main' };

async function main() {
  const envFile = process.argv[2] ?? '.env';
  await configureCrawler(envFile);

  const transaction = Env.TRANSACTION_TYPE;
  const parser = createQuintoAndarParser(transaction);

  logger.info({
    ...log,
    message: `Starting QuintoAndar scrape: ${SAO_PAULO_NEIGHBORHOODS.length} neighborhoods, type=${transaction}`,
  });

  const result = await executeScrape(parser, {
    neighborhoods: SAO_PAULO_NEIGHBORHOODS,
    transactionType: transaction,
    rateLimiterConfig: {
      baseDelayMs: Env.REQUEST_DELAY_MS,
      batchSize: Env.BATCH_SIZE,
      batchPauseMs: Env.BATCH_PAUSE_MS,
      maxPagesPerSession: Env.MAX_PAGES_PER_SESSION,
    },
    maxPagesPerNeighborhood: Env.MAX_PAGES_PER_NEIGHBORHOOD,
  });

  logger.info({
    ...log,
    message: `Scrape complete: job=${result.jobId}, found=${result.listingsFound}, created=${result.listingsCreated}, updated=${result.listingsUpdated}, errors=${result.errors.length}`,
  });

  await shutdownCrawler();
  logger.info({ ...log, message: 'Crawler finished' });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
