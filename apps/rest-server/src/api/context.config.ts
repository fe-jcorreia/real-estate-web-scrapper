import type { JwtPayload } from '@domain/model/auth.model.js';
import type { ServerContext } from '@domain/model/context.model.js';
import { ContextProvider } from '@repo/core/context';
import { JwtService } from '@repo/core/security';
import type { FastifyRequest } from 'fastify';

export function createContext(req: FastifyRequest): ServerContext {
  const authToken = req.headers.authorization;
  let userId: string | undefined;

  if (authToken) {
    userId = parseAuthToken(authToken)?.id;
  }

  const context: ServerContext = { uuid: crypto.randomUUID(), userId };
  ContextProvider.getInstance<ServerContext>().enterWith(context);

  return context;
}

function parseAuthToken(token: string): JwtPayload | undefined {
  const decodedToken = JwtService.verify<JwtPayload>(token);
  return decodedToken?.data;
}
