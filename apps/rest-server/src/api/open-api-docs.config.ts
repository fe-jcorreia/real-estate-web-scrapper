import fastifySwagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import {
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransform,
  fastifyZodOpenApiTransformObject,
} from 'fastify-zod-openapi';
import type { ZodOpenApiVersion } from 'zod-openapi';

export async function configureOpenApiDocs(app: FastifyInstance) {
  await app.register(fastifyZodOpenApiPlugin);

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Real Estate Web Scrapper API',
        description: 'API for querying scraped real estate data',
        version: '1.0.0',
      },
      openapi: '3.1.0' satisfies ZodOpenApiVersion,
    },
    transform: fastifyZodOpenApiTransform,
    transformObject: fastifyZodOpenApiTransformObject,
  });

  await app.register(swaggerUi, { routePrefix: '/docs' });
}
