import { z } from 'zod';

export const EnvSchema = z.object({
  LOGGER_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'critical']).default('info'),
  DATABASE_URL: z.string().url(),
  STORAGE_PATH: z.string().default('./data/raw-html'),
  BROWSER_HEADLESS: z.stringbool().default(true),
  REQUEST_DELAY_MS: z.coerce.number().int().min(0).default(2000),
  MAX_CONCURRENT_PAGES: z.coerce.number().int().min(1).default(1),
});

export type EnvSchemaType = z.infer<typeof EnvSchema>;
