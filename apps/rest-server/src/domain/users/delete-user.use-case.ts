import { UsersDbDatasource } from '@data/users/users.db.datasource.js';
import { UserUseCase } from './user.use-case.js';

async function exec() {
  const user = await UserUseCase.exec();
  await UsersDbDatasource.remove(user);
}

export const DeleteUserUseCase = { exec };
