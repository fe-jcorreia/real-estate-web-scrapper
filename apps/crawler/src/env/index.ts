import { DotEnvStrategy, EnvConfig } from '@repo/env';
import { EnvSchema, type EnvSchemaType } from './env-schema.js';

export let Env: EnvSchemaType;

export async function configureEnv(envFile: string) {
  const config = new EnvConfig({ schema: EnvSchema, providers: [new DotEnvStrategy(envFile)] });
  await config.setup();
  Env = config.getEnv();
}
