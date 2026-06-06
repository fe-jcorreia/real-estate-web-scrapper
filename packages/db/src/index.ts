import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

export * from './generated/prisma/client.js';
export * from './clear-database.utils.js';
export * from './database-id.utils.js';

export let dbClient: PrismaClient;

export async function configureDatabase() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  dbClient = new PrismaClient({ adapter });
  await dbClient.$connect();
}
