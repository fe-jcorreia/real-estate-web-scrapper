import { configureRestServer } from '@api/rest.config.js';
import { SUPPORTED_LOCALES } from '@domain/locale/index.js';
import { PT_BR_LOCALE } from '@domain/locale/pt-BR.locale.js';
import { Env, configureEnv } from '@env/index.js';
import { Localization } from '@repo/core/localization';
import { configureLogger } from '@repo/core/log';
import { CryptoService, JwtService } from '@repo/core/security';
import { configureDatabase } from '@repo/db';
import type { FastifyInstance } from 'fastify';

export async function configureServer(envFile: string): Promise<FastifyInstance> {
  await configureEnv(envFile);
  await configureLogger(Env.LOGGER_LEVEL);

  CryptoService.configure(Env.CRYPTO_SALT);
  JwtService.configure({ expiration: Env.JWT_EXPIRATION, secret: Env.JWT_SECRET });
  Localization.configure(SUPPORTED_LOCALES, 'pt-BR', { 'pt-BR': PT_BR_LOCALE });

  await configureDatabase();
  return configureRestServer();
}
