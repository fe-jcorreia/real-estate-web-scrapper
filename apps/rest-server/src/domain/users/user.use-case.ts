import { UsersDbDatasource } from '@data/users/users.db.datasource.js';
import type { AuthenticatedContext } from '@domain/model/context.model.js';
import { ContextProvider } from '@repo/core/context';
import { NotFoundError } from '@repo/core/error';
import { UserErrors } from './users.error.js';

async function exec() {
  const userId = ContextProvider.getInstance<AuthenticatedContext>().get().userId;
  const user = await UsersDbDatasource.findOneById(userId);

  if (!user) {
    throw new NotFoundError(UserErrors.NotFound);
  }

  return user;
}

export const UserUseCase = { exec };
