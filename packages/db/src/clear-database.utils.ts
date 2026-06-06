import { dbClient } from './index.js';

export async function clearDatabase() {
  const tablenames = await dbClient.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  await dbClient.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
}
