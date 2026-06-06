import { z } from 'zod';

export const ListingSchema = z.object({
  sourceUrl: z.string().url(),
  source: z.string().min(1),
  sourceId: z.string().min(1).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  area: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  parkingSpaces: z.number().int().min(0).optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().max(10).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  propertyType: z.string().optional(),
  listingType: z.enum(['sale', 'rent']).optional(),
  rawData: z.record(z.unknown()).optional(),
});

export type ListingInput = z.infer<typeof ListingSchema>;
