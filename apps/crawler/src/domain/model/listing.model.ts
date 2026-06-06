import { z } from 'zod';

export const ListingSchema = z.object({
  source: z.string().min(1),
  sourceId: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  currency: z.string().max(10).optional(),
  propertyType: z.string().optional(),
  transactionType: z.string().optional(),
  areaSqm: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  parkingSpots: z.number().int().min(0).optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().max(20).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  rawData: z.record(z.string(), z.unknown()).optional(),
});

export type ListingInput = z.infer<typeof ListingSchema>;
