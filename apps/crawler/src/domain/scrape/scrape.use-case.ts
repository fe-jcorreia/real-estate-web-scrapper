import { ApplicationLayer, logger } from '@repo/core/log';
import type { ListingInput } from '../model/listing.model.js';
import type { SiteParser } from '../../parsers/base.parser.js';

const log = { layer: ApplicationLayer.Domain, method: 'scrape' };

export async function executeScrape(parser: SiteParser, urls: string[], fetchPage: (url: string) => Promise<string>) {
  const listings: ListingInput[] = [];
  const errors: { url: string; error: string }[] = [];

  for (const url of urls) {
    try {
      logger.info({ ...log, message: `Scraping ${url}` });
      const html = await fetchPage(url);
      const parsed = parser.parseListings(html);
      listings.push(...parsed);
      logger.info({ ...log, message: `Found ${parsed.length} listings from ${url}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ ...log, method: 'scrape', error });
      errors.push({ url, error: message });
    }
  }

  return { listings, errors };
}
