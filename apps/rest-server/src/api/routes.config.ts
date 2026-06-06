import type { ServerContext } from '../domain/model/context.model.js';
import { ContextProvider } from '@repo/core/context';
import { ApplicationLayer, logger } from '@repo/core/log';
import type { FastifyInstance } from 'fastify';
import type { FastifyZodOpenApiTypeProvider } from 'fastify-zod-openapi';
import { errorsSchema } from './common/common.schema.js';
import { ROUTES_METHODS, type RouteMethodHandler, type Routes, type RoutesHttpMethod } from './routes.js';

interface RegisterRouteParams {
  fastify: FastifyInstance;
  method: RoutesHttpMethod;
  route: RouteMethodHandler;
  routes: Routes;
}

const ROUTES_RESOURCES_TO_REGISTER: Routes[] = [];

export async function configureRoutes(fastify: FastifyInstance) {
  for (const routes of ROUTES_RESOURCES_TO_REGISTER) {
    await fastify.register(registerExistingRoutesMethods(routes), { prefix: routes.base });
  }
}

function registerExistingRoutesMethods(routes: Routes) {
  return async (fastify: FastifyInstance) => {
    ROUTES_METHODS.forEach(method => {
      const methodRoutes = routes[method];
      if (!methodRoutes) return;
      const handlers = Array.isArray(methodRoutes) ? methodRoutes : [methodRoutes];
      handlers.forEach(handler => registerRoute({ fastify, method, route: handler, routes }));
    });
  };
}

function registerRoute({ fastify, method, route, routes }: RegisterRouteParams) {
  const rootBeforeMiddlewares = routes.beforeMiddlewares ?? [];
  const beforeMiddlewares = rootBeforeMiddlewares.concat(route.beforeMiddlewares ?? []);
  const preParsing = beforeMiddlewares.length > 0 ? beforeMiddlewares : undefined;
  const preSerialization = route.afterMiddlewares;
  const schema = { ...route.schema, response: { 500: errorsSchema, ...route.schema.response } };

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().route({
    method,
    url: route.endpoint,
    schema,
    preParsing,
    preSerialization,
    handler: async (request, reply) => {
      const uuid = ContextProvider.getInstance<ServerContext>().get()?.uuid;
      const baseLog = { uuid, layer: ApplicationLayer.Api };
      logger.info({ ...baseLog, message: `${method.toUpperCase()} ${request.url}`, method });

      const response = await route.handler(request);
      const httpStatus = route.onSuccessHttpStatus ?? (method === 'post' ? 201 : 200);

      return reply.code(httpStatus).send(response);
    },
  });
}
