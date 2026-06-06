import { AuthErrors } from '@domain/auth/auth.error.js';
import type { AuthenticatedContext, ServerContext } from '@domain/model/context.model.js';
import { ContextProvider } from '@repo/core/context';
import { UnauthorizedError } from '@repo/core/error';

export async function AuthorizationMiddleware(): Promise<void> {
  const context = ContextProvider.getInstance<ServerContext>().get();

  if (!isAuthenticated(context)) {
    throw new UnauthorizedError(AuthErrors.Unauthorized);
  }
}

function isAuthenticated(context: any): context is AuthenticatedContext {
  return !!context.userId;
}
