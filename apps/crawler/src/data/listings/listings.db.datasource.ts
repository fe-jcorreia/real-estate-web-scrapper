import { dbClient, DatabaseIdGenerator } from '@repo/db';
import { ApplicationLayer, logger } from '@repo/core/log';
import type { ListingInput } from '../../domain/model/listing.model.js';

const log = { layer: ApplicationLayer.Data, method: 'listings' };

export const ListingsDbDatasource = {
  async upsert(input: ListingInput, scrapeJobId?: string) {
    const externalId = DatabaseIdGenerator.generate('l_');

    return dbClient.listingEntity.upsert({
      where: {
        source_sourceId: {
          source: input.source,
          sourceId: input.sourceId ?? input.sourceUrl,
        },
      },
      create: {
        id: externalId,
        sourceUrl: input.sourceUrl,
        source: input.source,
        sourceId: input.sourceId,
        title: input.title,
        description: input.description,
        price: input.price,
        area: input.area,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        parkingSpaces: input.parkingSpaces,
        address: input.address,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        latitude: input.latitude,
        longitude: input.longitude,
        propertyType: input.propertyType,
        listingType: input.listingType,
        rawData: input.rawData ?? undefined,
        scrapeJobId,
      },
      update: {
        lastSeenAt: new Date(),
        price: input.price,
        title: input.title,
        description: input.description,
        rawData: input.rawData ?? undefined,
      },
    });
  },

  async findBySourceId(source: string, sourceId: string) {
    return dbClient.listingEntity.findUnique({
      where: { source_sourceId: { source, sourceId } },
    });
  },

  async count() {
    return dbClient.listingEntity.count();
  },
};
