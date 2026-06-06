import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema.prisma',
  migrate: {
    migrations: './migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
