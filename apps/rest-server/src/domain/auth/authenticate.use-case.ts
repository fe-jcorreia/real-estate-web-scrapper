import { UsersDbDatasource } from '@data/users/users.db.datasource.js';
import type { Auth, AuthInput, JwtPayload } from '@domain/model/auth.model.js';
import { UnauthorizedError } from '@repo/core/error';
import { CryptoService, JwtService } from '@repo/core/security';
import { AuthErrors } from './auth.error.js';

const FAKE_SALT_TO_FORCE_HASH = 's';

async function exec({ email, password }: AuthInput): Promise<Auth> {
  const user = await UsersDbDatasource.findOneByEmail(email);
  const hashedPassword = await CryptoService.generateHashWithSalt(password, user?.salt ?? FAKE_SALT_TO_FORCE_HASH);

  if (!user || hashedPassword !== user.password) {
    throw new UnauthorizedError(AuthErrors.Credentials);
  }

  return { user, token: JwtService.sign<JwtPayload>({ id: user.id }) };
}

export const AuthenticateUseCase = { exec };
