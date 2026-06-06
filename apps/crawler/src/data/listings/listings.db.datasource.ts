import { dbClient, DatabaseIdGenerator, type Prisma } from '@repo/db';
import { ApplicationLayer, logger } from '@repo/core/log';
import type { ListingInput } from '../../domain/model/listing.model.js';

const log = { layer: ApplicationLayer.Data, method: 'listings' };

export const ListingsDbDatasource = {
  async upsert(input: ListingInput) {
    const externalId = DatabaseIdGenerator.generate('l_');

    const result = await dbClient.listingEntity.upsert({
      where: {
        listing_source_unique: {
          source: input.source,
          sourceId: input.sourceId,
        },
      },
      create: {
        id: externalId,
        source: input.source,
        sourceId: input.sourceId,
        url: input.url,
        title: input.title,
        description: input.description,
        price: input.price,
        currency: input.currency,
        propertyType: input.propertyType,
        transactionType: input.transactionType,
        areaSqm: input.areaSqm,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        parkingSpots: input.parkingSpots,
        address: input.address,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        latitude: input.latitude,
        longitude: input.longitude,
        rawData: input.rawData as Prisma.InputJsonValue | undefined,
      },
      update: {
        url: input.url,
        title: input.title,
        description: input.description,
        price: input.price,
        currency: input.currency,
        propertyType: input.propertyType,
        transactionType: input.transactionType,
        areaSqm: input.areaSqm,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        parkingSpots: input.parkingSpots,
        address: input.address,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        latitude: input.latitude,
        longitude: input.longitude,
        rawData: input.rawData as Prisma.InputJsonValue | undefined,
      },
    });

    logger.debug({ ...log, message: `Upserted listing ${result.id} (${input.source}/${input.sourceId})` });
    return result;
  },

  async findBySourceId(source: string, sourceId: string) {
    return dbClient.listingEntity.findUnique({
      where: { listing_source_unique: { source, sourceId } },
    });
  },

  async count() {
    return dbClient.listingEntity.count();
  },
};
