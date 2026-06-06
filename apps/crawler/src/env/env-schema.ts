import { z } from 'zod';

export const EnvSchema = z.object({
  LOGGER_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'critical']).default('info'),
  DATABASE_URL: z.string().url(),
  STORAGE_PATH: z.string().default('./data/raw-html'),
  BROWSER_HEADLESS: z.stringbool().default(true),
  REQUEST_DELAY_MS: z.coerce.number().int().min(0).default(4000),
  MAX_CONCURRENT_PAGES: z.coerce.number().int().min(1).default(1),
  BATCH_SIZE: z.coerce.number().int().min(1).default(50),
  BATCH_PAUSE_MS: z.coerce.number().int().min(0).default(45000),
  MAX_PAGES_PER_SESSION: z.coerce.number().int().min(1).default(200),
  MAX_PAGES_PER_NEIGHBORHOOD: z.coerce.number().int().min(1).default(100),
  TRANSACTION_TYPE: z.enum(['rent', 'sale']).default('rent'),
});

export type EnvSchemaType = z.infer<typeof EnvSchema>;
