import { ApplicationLayer, logger } from '@repo/core/log';
import { configureCrawler, shutdownCrawler } from './crawler.config.js';
import { executeScrapeApi } from './domain/scrape/scrape-api.use-case.js';

const log = { layer: ApplicationLayer.Domain, method: 'main' };

async function main() {
  const envFile = process.argv[2] ?? '.env';
  await configureCrawler(envFile);

  logger.info({ ...log, message: 'Starting QuintoAndar API scraper' });
  await executeScrapeApi();

  await shutdownCrawler();
  logger.info({ ...log, message: 'Crawler finished' });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
