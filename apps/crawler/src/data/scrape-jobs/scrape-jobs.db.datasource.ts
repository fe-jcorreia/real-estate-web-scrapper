import { dbClient, DatabaseIdGenerator, type Prisma } from '@repo/db';
import type { ScrapeJobInput, ScrapeJobUpdate } from '../../domain/model/scrape-job.model.js';

export const ScrapeJobsDbDatasource = {
  async create(input: ScrapeJobInput) {
    const externalId = DatabaseIdGenerator.generate('j_');
    return dbClient.scrapeJobEntity.create({
      data: {
        id: externalId,
        source: input.source,
        status: 'pending',
      },
    });
  },

  async update(id: string, data: ScrapeJobUpdate) {
    return dbClient.scrapeJobEntity.update({
      where: { id },
      data: {
        ...data,
        errorLog: data.errorLog != null ? (data.errorLog as Prisma.InputJsonValue) : undefined,
      },
    });
  },

  async findById(id: string) {
    return dbClient.scrapeJobEntity.findUnique({ where: { id } });
  },
};
