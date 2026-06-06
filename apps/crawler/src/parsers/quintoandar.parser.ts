import * as cheerio from 'cheerio';
import { ApplicationLayer, logger } from '@repo/core/log';
import type { ListingInput } from '../domain/model/listing.model.js';
import type { SiteParser } from './base.parser.js';
import type { TransactionType } from '../domain/model/neighborhood.model.js';

const log = { layer: ApplicationLayer.Domain, method: 'quintoandar-parser' };

const LISTING_LINK_PATTERN = /\/imovel\/(\d+)\/(alugar|comprar)\//;

function parsePrice(text: string): number | undefined {
  const match = text.replace(/\s/g, '').match(/R\$\s*([\d.,]+)/);
  if (!match?.[1]) return undefined;
  const cleaned = match[1].replace(/\./g, '').replace(',', '.');
  const value = Number.parseFloat(cleaned);
  return Number.isNaN(value) ? undefined : value;
}

function parseArea(text: string): number | undefined {
  const match = text.match(/(\d+)\s*m²/);
  if (!match?.[1]) return undefined;
  const value = Number.parseInt(match[1], 10);
  return Number.isNaN(value) ? undefined : value;
}

function parseIntField(text: string, pattern: RegExp): number | undefined {
  const match = text.match(pattern);
  if (!match?.[1]) return undefined;
  const value = Number.parseInt(match[1], 10);
  return Number.isNaN(value) ? undefined : value;
}

function extractTransactionType(href: string): TransactionType {
  return href.includes('/comprar/') ? 'sale' : 'rent';
}

function extractPropertyType(href: string): string | undefined {
  const match = href.match(/\/(alugar|comprar)\/([\w-]+?)-\d+-quarto/);
  if (!match?.[2]) return undefined;
  return match[2].replace(/-/g, ' ');
}

function buildListingUrl(href: string): string {
  if (href.startsWith('http')) return href;
  return `https://www.quintoandar.com.br${href}`;
}

export function createQuintoAndarParser(defaultTransaction: TransactionType): SiteParser {
  return {
    source: 'quintoandar',
    baseUrl: 'https://www.quintoandar.com.br',

    parseListings(html: string): ListingInput[] {
      const $ = cheerio.load(html);
      const listings: ListingInput[] = [];

      $('a[href*="/imovel/"]').each((_, el) => {
        const anchor = $(el);
        const href = anchor.attr('href') ?? '';
        const match = href.match(LISTING_LINK_PATTERN);
        if (!match?.[1]) return;

        const sourceId = match[1];
        const cardText = anchor.text();
        const transactionType = extractTransactionType(href);

        const title = anchor.find('h2, h3, [class*="title"], [class*="Title"]').first().text().trim()
          || cardText.split('\n').find((line) => line.trim().length > 5)?.trim()
          || `Imóvel ${sourceId}`;

        const listing: ListingInput = {
          source: 'quintoandar',
          sourceId,
          url: buildListingUrl(href),
          title,
          transactionType,
          price: parsePrice(cardText),
          area: parseArea(cardText),
          bedrooms: parseIntField(cardText, /(\d+)\s*quartos?/i),
          bathrooms: parseIntField(cardText, /(\d+)\s*banheiros?/i),
          parkingSpots: parseIntField(cardText, /(\d+)\s*vagas?/i),
          propertyType: extractPropertyType(href),
          city: 'São Paulo',
          state: 'SP',
          currency: 'BRL',
          rawData: { href, cardText: cardText.substring(0, 500) },
        };

        const addressParts = cardText.match(/(?:Rua|Av|Avenida|Alameda|Travessa|Praça)[^,\n]+/i);
        if (addressParts?.[0]) {
          listing.address = addressParts[0].trim();
        }

        const neighborhoodMatch = href.match(/quarto[s]?-([\w-]+)-sao-paulo/);
        if (neighborhoodMatch?.[1]) {
          listing.neighborhood = neighborhoodMatch[1].replace(/-/g, ' ');
        }

        listings.push(listing);
      });

      const uniqueListings = Array.from(
        new Map(listings.map((l) => [l.sourceId, l])).values(),
      );

      logger.info({ ...log, message: `Parsed ${uniqueListings.length} listings (${listings.length - uniqueListings.length} duplicates removed)` });
      return uniqueListings;
    },

    buildSearchUrl(page: number, params?: Record<string, string>): string {
      const transaction = params?.['transaction'] === 'sale' ? 'comprar' : 'alugar';
      const neighborhood = params?.['neighborhood'] ?? '';
      if (neighborhood) {
        return `https://www.quintoandar.com.br/${transaction}/imovel/sao-paulo-sp-brasil/bairro-${neighborhood}`;
      }
      return `https://www.quintoandar.com.br/${transaction}/imovel/sao-paulo-sp-brasil`;
    },
  };
}
