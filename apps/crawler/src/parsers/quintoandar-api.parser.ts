import { ApplicationLayer, logger } from '@repo/core/log';
import type { ListingInput } from '../domain/model/listing.model.js';
import type { EsHit, BusinessContext } from '../data/api/quintoandar-api.client.js';

const log = { layer: ApplicationLayer.Domain, method: 'quintoandar-api-parser' };

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value > 0 ? value : undefined;
  }
  return undefined;
}

function numOrZero(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value) && value >= 0) {
    return value;
  }
  return undefined;
}

function str(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return undefined;
}

function parseLocation(value: unknown): { lat: number; lon: number } | undefined {
  if (value && typeof value === 'object' && 'lat' in value && 'lon' in value) {
    const lat = (value as { lat: unknown }).lat;
    const lon = (value as { lon: unknown }).lon;
    if (typeof lat === 'number' && typeof lon === 'number') {
      return { lat, lon };
    }
  }
  return undefined;
}

function buildTitle(source: Record<string, unknown>): string {
  const type = str(source.type) ?? 'Imóvel';
  const bedrooms = numOrZero(source.bedrooms);
  const area = num(source.area);
  const address = str(source.address);

  const parts = [type];
  if (bedrooms != null) parts.push(`${bedrooms}q`);
  if (area != null) parts.push(`${area}m²`);
  if (address) parts.push(`- ${address}`);

  return parts.join(' ');
}

function buildUrl(id: string | number): string {
  return `https://www.quintoandar.com.br/imovel/${id}`;
}

export function parseEsHits(hits: EsHit[], businessContext: BusinessContext): ListingInput[] {
  const listings: ListingInput[] = [];
  const transactionType = businessContext === 'SALE' ? 'sale' : 'rent';

  for (const hit of hits) {
    const s = hit._source;
    const sourceId = String(s.id ?? hit._id);

    const price = transactionType === 'rent' ? num(s.totalCost) : num(s.salePrice);
    const iptu = numOrZero(s.iptu);
    const location = parseLocation(s.location);

    const listing: ListingInput = {
      source: 'quintoandar',
      sourceId,
      url: buildUrl(sourceId),
      title: buildTitle(s),
      price,
      currency: 'BRL',
      propertyType: str(s.type),
      transactionType,
      area: num(s.area),
      bedrooms: numOrZero(s.bedrooms),
      bathrooms: numOrZero(s.bathrooms),
      address: str(s.address),
      zipCode: str(s.postalCode),
      latitude: location?.lat,
      longitude: location?.lon,
      rawData: {
        suites: numOrZero(s.suites),
        regionId: numOrZero(s.regionId),
        iptu: iptu != null && iptu !== -1 ? iptu : undefined,
        salePrice: num(s.salePrice),
        totalCost: num(s.totalCost),
      },
    };

    listings.push(listing);
  }

  logger.info({ ...log, message: `Parsed ${listings.length} listings from API response` });
  return listings;
}
