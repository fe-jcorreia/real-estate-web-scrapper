import { UsersDbDatasource } from '@data/users/users.db.datasource.js';
import type { UpdateUserInput, User, UserWithCredentials } from '@domain/model/users.model.js';
import { ForbiddenError } from '@repo/core/error';
import { CryptoService } from '@repo/core/security';
import { UserUseCase } from './user.use-case.js';
import { UserErrors } from './users.error.js';

async function exec(input: UpdateUserInput): Promise<User> {
  const user = await UserUseCase.exec();

  if (input.password) {
    await checkOldPassword(user, input);
    input.password = await CryptoService.generateHashWithSalt(input.password, user.salt);
  }

  const { oldPassword, ...fieldsToUpdate } = input;
  return UsersDbDatasource.update(user.id, fieldsToUpdate);
}

async function checkOldPassword(user: UserWithCredentials, input: UpdateUserInput) {
  const hashedPassword = input.oldPassword && (await CryptoService.generateHashWithSalt(input.oldPassword, user.salt));

  if (!input.oldPassword || hashedPassword !== user.password) {
    throw new ForbiddenError(UserErrors.InvalidOldPassword);
  }
}

export const UpdateUserUseCase = { exec };
