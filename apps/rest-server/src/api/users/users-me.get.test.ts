import { AuthErrors } from '@domain/auth/auth.error.js';
import type { User } from '@domain/model/users.model.js';
import { UserErrors } from '@domain/users/users.error.js';
import { type Prisma, clearDatabase, dbClient } from '@repo/db';
import { checkErrors } from '@test/checker.test.js';
import { RequestMaker } from '@test/request-maker.test.js';
import { expect } from 'chai';

describe('GET /users/me', () => {
  const id = 'u_123';
  const endpoint = '/users/me';

  let requestMaker: RequestMaker<User>;
  let client: Prisma.UserEntityDelegate;

  before(async () => {
    requestMaker = new RequestMaker();
    client = dbClient.userEntity;
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it('should get user successfully', async () => {
    const data = { id, email: 'admin@taqtile.com.br', name: 'Admin Taqtile', salt: '', password: '' };
    const user = await client.create({ data });

    requestMaker.auth({ id });
    const response = await requestMaker.get({ endpoint });

    expect(response.data).to.be.deep.eq({ id: user.id, email: user.email, name: user.name });
  });

  it('should give an error if user is deleted', async () => {
    const data = { id, email: 'admin@taqtile.com.br', name: 'Admin Taqtile', salt: '', password: '' };
    await client.create({ data: { ...data, deletedAt: new Date() } });

    requestMaker.auth({ id });
    const response = await requestMaker.get({ endpoint, expectedStatus: 404 });

    checkErrors(response, [UserErrors.NotFound]);
  });

  it('should give an error if user is not authenticated', async () => {
    const data = { id, email: 'admin@taqtile.com.br', name: 'Admin Taqtile', salt: '', password: '' };
    await client.create({ data });

    const response = await requestMaker.get({ endpoint, expectedStatus: 401 });

    checkErrors(response, [AuthErrors.Unauthorized]);
  });
});
