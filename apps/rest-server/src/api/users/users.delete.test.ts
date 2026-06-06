import { AuthErrors } from '@domain/auth/auth.error.js';
import type { User } from '@domain/model/users.model.js';
import { CryptoService } from '@repo/core/security';
import { type Prisma, clearDatabase, dbClient } from '@repo/db';
import { checkErrors } from '@test/checker.test.js';
import { RequestMaker } from '@test/request-maker.test.js';
import { expect } from 'chai';
import sinon from 'sinon';

describe('DELETE /users/me', () => {
  const userId = 'u_123';
  const password = '1234Qwer@';
  const salt = 'salt';
  const endpoint = '/users/me';

  let requestMaker: RequestMaker<User>;
  let client: Prisma.UserEntityDelegate;

  before(async () => {
    requestMaker = new RequestMaker();
    client = dbClient.userEntity;
  });

  beforeEach(() => {
    sinon.useFakeTimers({ now: new Date(), shouldAdvanceTime: false });
  });

  afterEach(async () => {
    sinon.restore();
    await clearDatabase();
  });

  it('should delete user personal info', async () => {
    const data = { id: userId, email: 'admin@taqtile.com.br', name: 'Admin Taqtile', salt, password };
    const userDbBefore = await client.create({ data });

    requestMaker.auth({ id: userId });
    const response = await requestMaker.delete({ endpoint, expectedStatus: 204 });

    const userDbAfter = await client.findUnique({ where: { id: userId } });
    expect(response.data).to.be.empty;
    expect(userDbAfter).to.be.deep.eq({
      ...userDbBefore,
      email: await CryptoService.generateHashWithSalt(userDbBefore.email, salt),
      name: await CryptoService.generateHashWithSalt(userDbBefore.name, salt),
      password: null,
      deletedAt: new Date(),
    });
  });

  it('should give an error if user is not authenticated', async () => {
    const data = { id: userId, email: 'admin@taqtile.com.br', name: 'Admin Taqtile', salt, password };
    await client.create({ data });

    const response = await requestMaker.delete({ endpoint, expectedStatus: 401 });

    checkErrors(response, [AuthErrors.Unauthorized]);
  });
});
