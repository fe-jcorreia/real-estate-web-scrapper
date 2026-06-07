import { expect } from 'chai';
import { describe, it } from 'mocha';
import { generateBuckets } from './search-bucket.model.js';

describe('generateBuckets', () => {
  it('generates 16 buckets (4 bedrooms x 4 bathrooms)', () => {
    const buckets = generateBuckets('RENT');
    expect(buckets).to.have.length(16);
  });

  it('assigns correct business context', () => {
    const rent = generateBuckets('RENT');
    const sale = generateBuckets('SALE');
    expect(rent.every((b) => b.businessContext === 'RENT')).to.be.true;
    expect(sale.every((b) => b.businessContext === 'SALE')).to.be.true;
  });

  it('covers bedroom values 1-4', () => {
    const buckets = generateBuckets('RENT');
    const bedrooms = [...new Set(buckets.map((b) => b.bedrooms))];
    expect(bedrooms.sort()).to.deep.equal([1, 2, 3, 4]);
  });

  it('covers bathroom values 1-4', () => {
    const buckets = generateBuckets('RENT');
    const bathrooms = [...new Set(buckets.map((b) => b.bathrooms))];
    expect(bathrooms.sort()).to.deep.equal([1, 2, 3, 4]);
  });

  it('generates descriptive labels', () => {
    const buckets = generateBuckets('SALE');
    expect(buckets[0]!.label).to.equal('SALE 1q 1b');
  });
});
