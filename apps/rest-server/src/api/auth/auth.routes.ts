import type { Routes } from '@api/routes';
import { AuthenticateUseCase } from '@domain/auth/authenticate.use-case.js';
import { authInputSchema, authSchema } from './auth.schema';

export const AuthRoutes: Routes = {
  base: '/auth',
  post: {
    endpoint: '',
    schema: { body: authInputSchema, response: { 201: authSchema } },
    handler: ({ body }) => AuthenticateUseCase.exec(body),
  },
};
