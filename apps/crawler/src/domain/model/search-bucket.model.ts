import type { BusinessContext } from '../../data/api/quintoandar-api.client.js';

export interface SearchBucket {
  businessContext: BusinessContext;
  bedrooms: number | undefined;
  bathrooms: number | undefined;
  label: string;
}

const BEDROOM_VALUES = [1, 2, 3, 4];
const BATHROOM_VALUES = [1, 2, 3, 4];

export function generateBuckets(businessContext: BusinessContext): SearchBucket[] {
  const buckets: SearchBucket[] = [];

  for (const bedrooms of BEDROOM_VALUES) {
    for (const bathrooms of BATHROOM_VALUES) {
      buckets.push({
        businessContext,
        bedrooms,
        bathrooms,
        label: `${businessContext} ${bedrooms}q ${bathrooms}b`,
      });
    }
  }

  return buckets;
}
