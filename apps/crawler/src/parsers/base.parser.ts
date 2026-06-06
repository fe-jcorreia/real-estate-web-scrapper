import type { ListingInput } from '../domain/model/listing.model.js';

export interface SiteParser {
  readonly source: string;
  readonly baseUrl: string;
  parseListings(html: string): ListingInput[];
  buildSearchUrl(page: number, params?: Record<string, string>): string;
}
