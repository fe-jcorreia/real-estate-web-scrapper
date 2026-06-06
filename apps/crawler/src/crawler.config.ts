import { configureEnv, Env } from './env/index.js';
import { configureLogger } from '@repo/core/log';
import { configureDatabase } from '@repo/db';
import { BrowserClient } from './data/browser/index.js';

export async function configureCrawler(envFile: string) {
  await configureEnv(envFile);
  await configureLogger(Env.LOGGER_LEVEL);
  await configureDatabase();
  await BrowserClient.launch();
}

export async function shutdownCrawler() {
  await BrowserClient.close();
}
