import type { UpdateUserInput, User, UserInput, UserWithCredentials } from '@domain/model/users.model.js';
import { UserErrors } from '@domain/users/users.error.js';
import { ConflictError } from '@repo/core/error';
import { CryptoService } from '@repo/core/security';
import { DatabaseIdGenerator, dbClient } from '@repo/db';

const UNIQUE_CONSTRAINT_ERROR = 'P2002';
const EXTERNAL_ID_PREFIX = 'u_';

async function create(input: UserInput): Promise<User> {
  const salt = CryptoService.generateRandomPassword();
  const password = await CryptoService.generateHashWithSalt(input.password, salt);
  const id = DatabaseIdGenerator.generate(EXTERNAL_ID_PREFIX);

  try {
    return await dbClient.userEntity.create({ data: { ...input, id, password, salt } });
  } catch (error) {
    if (error.code === UNIQUE_CONSTRAINT_ERROR) {
      throw new ConflictError(UserErrors.AlreadyRegistered);
    }

    throw error;
  }
}

function findOneByEmail(email: string): Promise<UserWithCredentials | null> {
  return dbClient.userEntity.findUnique({ where: { email, deletedAt: null } });
}

function findOneById(id: string): Promise<UserWithCredentials | null> {
  return dbClient.userEntity.findUnique({ where: { id, deletedAt: null } });
}

function update(id: string, input: UpdateUserInput): Promise<User> {
  return dbClient.userEntity.update({ where: { id, deletedAt: null }, data: input });
}

async function remove(user: UserWithCredentials): Promise<User> {
  return dbClient.userEntity.update({
    where: { id: user.id },
    data: {
      email: await CryptoService.generateHashWithSalt(user.email, user.salt),
      name: await CryptoService.generateHashWithSalt(user.name, user.salt),
      password: null,
      deletedAt: new Date(),
    },
  });
}

export const UsersDbDatasource = { create, findOneByEmail, findOneById, update, remove };
