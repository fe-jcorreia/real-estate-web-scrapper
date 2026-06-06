import { UsersDbDatasource } from '@data/users/users.db.datasource.js';
import type { User, UserInput } from '@domain/model/users.model.js';

function exec(input: UserInput): Promise<User> {
  // It's recommended to have an email confirmation on signUp
  return UsersDbDatasource.create(input);
}

export const CreateUserUseCase = { exec };
