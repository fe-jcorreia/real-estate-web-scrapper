import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import { configureLogger } from '@repo/core/log';
import type { EsHit } from '../data/api/quintoandar-api.client.js';
import { parseEsHits } from './quintoandar-api.parser.js';

before(() => configureLogger('error'));

function makeHit(overrides: Record<string, unknown> = {}): EsHit {
  return {
    _id: 'abc123',
    _score: 1.0,
    _source: {
      id: 'abc123',
      area: 65,
      address: 'Rua Augusta, 100',
      type: 'Apartamento',
      bedrooms: 2,
      totalCost: 3500,
      bathrooms: 1,
      salePrice: 0,
      iptu: 150,
      location: { lat: -23.55, lon: -46.65 },
      suites: 1,
      postalCode: '01305000',
      regionId: 42,
      ...overrides,
    },
  };
}

describe('parseEsHits', () => {
  it('maps rent listing correctly', () => {
    const result = parseEsHits([makeHit()], 'RENT');
    expect(result).to.have.length(1);
    const listing = result[0]!;
    expect(listing.source).to.equal('quintoandar');
    expect(listing.sourceId).to.equal('abc123');
    expect(listing.price).to.equal(3500);
    expect(listing.transactionType).to.equal('rent');
    expect(listing.area).to.equal(65);
    expect(listing.bedrooms).to.equal(2);
    expect(listing.bathrooms).to.equal(1);
    expect(listing.latitude).to.equal(-23.55);
    expect(listing.longitude).to.equal(-46.65);
    expect(listing.zipCode).to.equal('01305000');
    expect(listing.url).to.equal('https://www.quintoandar.com.br/imovel/abc123');
    expect(listing.currency).to.equal('BRL');
  });

  it('maps sale listing using salePrice', () => {
    const result = parseEsHits([makeHit({ salePrice: 500000, totalCost: 3500 })], 'SALE');
    expect(result[0]!.price).to.equal(500000);
    expect(result[0]!.transactionType).to.equal('sale');
  });

  it('treats iptu=-1 as undefined', () => {
    const result = parseEsHits([makeHit({ iptu: -1 })], 'RENT');
    expect((result[0]!.rawData as Record<string, unknown>).iptu).to.be.undefined;
  });

  it('handles missing location gracefully', () => {
    const result = parseEsHits([makeHit({ location: null })], 'RENT');
    expect(result[0]!.latitude).to.be.undefined;
    expect(result[0]!.longitude).to.be.undefined;
  });

  it('builds title from type, bedrooms, area, address', () => {
    const result = parseEsHits([makeHit()], 'RENT');
    expect(result[0]!.title).to.equal('Apartamento 2q 65m² - Rua Augusta, 100');
  });

  it('returns empty array for empty hits', () => {
    const result = parseEsHits([], 'RENT');
    expect(result).to.have.length(0);
  });

  it('uses _id as fallback when id is missing', () => {
    const hit = makeHit();
    delete hit._source.id;
    const result = parseEsHits([hit], 'RENT');
    expect(result[0]!.sourceId).to.equal('abc123');
  });

  it('handles zero bedrooms', () => {
    const result = parseEsHits([makeHit({ bedrooms: 0 })], 'RENT');
    expect(result[0]!.bedrooms).to.equal(0);
    expect(result[0]!.title).to.include('0q');
  });
});
