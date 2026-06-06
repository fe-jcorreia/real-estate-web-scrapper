import { configureRoutes } from './routes.config.js';
import { Env } from '../env/index.js';
import fastifyCompress from '@fastify/compress';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyRequestContextPlugin from '@fastify/request-context';
import { ContextProvider } from '@repo/core/context';
import { logger } from '@repo/core/log';
import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-zod-openapi';
import { parseGlobalError } from './middlewares/error.global-middleware.js';
import { configureOpenApiDocs } from './open-api-docs.config.js';
import type { ServerContext } from '../domain/model/context.model.js';

function createContext(_req: FastifyRequest): ServerContext {
  const context: ServerContext = { uuid: crypto.randomUUID() };
  ContextProvider.getInstance<ServerContext>().enterWith(context);
  return context;
}

export async function configureRestServer(): Promise<FastifyInstance> {
  const app = Fastify();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(parseGlobalError);

  await app.register(fastifyCompress);
  await app.register(cors);
  await app.register(helmet);
  await app.register(fastifyRequestContextPlugin, { hook: 'onRequest', defaultStoreValues: createContext });

  if (Env.OPEN_API_SCHEMA_VISIBLE) {
    await configureOpenApiDocs(app);
  }

  await configureRoutes(app);

  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, async () => {
      await app.close();
      process.exit(0);
    });
  });

  try {
    const url = await app.listen({ port: Env.PORT, host: '::' });
    logger.info(`Server listening on ${url}`);
    return app;
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}
