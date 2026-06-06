import { configureRestServer } from './api/rest.config.js';
import { Env, configureEnv } from './env/index.js';
import { configureLogger } from '@repo/core/log';
import { configureDatabase } from '@repo/db';
import type { FastifyInstance } from 'fastify';

export async function configureServer(envFile: string): Promise<FastifyInstance> {
  await configureEnv(envFile);
  await configureLogger(Env.LOGGER_LEVEL);
  await configureDatabase();
  return configureRestServer();
}
