import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';
export * from './clear-database.utils.js';
export * from './database-id.utils.js';

export let dbClient: PrismaClient;

export async function configureDatabase() {
  dbClient = new PrismaClient();
  await dbClient.$connect();
}
