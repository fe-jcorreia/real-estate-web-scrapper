import { AuthorizationMiddleware } from '@api/middlewares/authorization.middleware.js';
import { emptyBodySchema } from '@api/common/common.schema.js';
import type { Routes } from '@api/routes.js';
import type { UserInput } from '@domain/model/users.model.js';
import { CreateUserUseCase } from '@domain/users/create-user.use-case.js';
import { DeleteUserUseCase } from '@domain/users/delete-user.use-case.js';
import { UpdateUserUseCase } from '@domain/users/update-user.use-case.js';
import { UserUseCase } from '@domain/users/user.use-case.js';
import { updateUserInputSchema, userInputSchema, userSchema } from './users.schema.js';

export const UsersRoutes: Routes = {
  base: '/users',
  post: {
    endpoint: '',
    schema: { body: userInputSchema, response: { 201: userSchema } },
    handler: ({ body }: { body: UserInput }) => CreateUserUseCase.exec(body),
  },
  get: {
    endpoint: '/me',
    schema: { response: { 200: userSchema } },
    beforeMiddlewares: [AuthorizationMiddleware],
    handler: () => UserUseCase.exec(),
  },
  patch: {
    endpoint: '/me',
    schema: { body: updateUserInputSchema, response: { 200: userSchema } },
    beforeMiddlewares: [AuthorizationMiddleware],
    handler: ({ body }) => UpdateUserUseCase.exec(body),
  },
  delete: {
    endpoint: '/me',
    schema: { response: { 204: emptyBodySchema } },
    beforeMiddlewares: [AuthorizationMiddleware],
    onSuccessHttpStatus: 204,
    handler: () => DeleteUserUseCase.exec(),
  },
};
