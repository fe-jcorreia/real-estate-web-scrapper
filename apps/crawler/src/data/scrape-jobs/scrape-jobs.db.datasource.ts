import { dbClient, DatabaseIdGenerator } from '@repo/db';
import type { ScrapeJobInput, ScrapeJobUpdate } from '../../domain/model/scrape-job.model.js';

export const ScrapeJobsDbDatasource = {
  async create(input: ScrapeJobInput) {
    const externalId = DatabaseIdGenerator.generate('j_');
    return dbClient.scrapeJobEntity.create({
      data: {
        id: externalId,
        source: input.source,
        totalPages: input.totalPages ?? 0,
        status: 'pending',
      },
    });
  },

  async update(id: string, data: ScrapeJobUpdate) {
    return dbClient.scrapeJobEntity.update({
      where: { id },
      data,
    });
  },

  async findById(id: string) {
    return dbClient.scrapeJobEntity.findUnique({ where: { id } });
  },
};
