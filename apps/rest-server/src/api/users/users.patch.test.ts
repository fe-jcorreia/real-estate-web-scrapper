import { AuthErrors } from '@domain/auth/auth.error.js';
import type { UpdateUserInput, User } from '@domain/model/users.model.js';
import { UserErrors } from '@domain/users/users.error.js';
import { CryptoService } from '@repo/core/security';
import { type Prisma, clearDatabase, dbClient } from '@repo/db';
import { checkErrors } from '@test/checker.test.js';
import { RequestMaker } from '@test/request-maker.test.js';
import { expect } from 'chai';
import sinon from 'sinon';

describe('PATCH /users/me', () => {
  const endpoint = '/users/me';

  const userId = 'u_123';
  const salt = 'salt';
  const password = '1234Qwer@';

  let requestMaker: RequestMaker<User, UpdateUserInput>;
  let client: Prisma.UserEntityDelegate;
  let hashedPassword: string;

  before(async () => {
    requestMaker = new RequestMaker();
    client = dbClient.userEntity;
    hashedPassword = await CryptoService.generateHashWithSalt(password, salt);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  after(() => {
    sinon.restore();
  });

  it('should change one personal field', async () => {
    const data = { id: userId, email: 'admin@taqtile.com.br', name: 'Admin Taqtile', password: hashedPassword, salt };
    const userDbBefore = await client.create({ data });

    requestMaker.auth({ id: userId });
    const body = { name: 'Admin Taqtile da Silva' };
    const response = await requestMaker.patch({ endpoint, body });

    const userDbAfter = (await client.findUnique({ where: { id: userId } }))!;
    expect(response.data).to.be.deep.eq({ id: userDbAfter.id, email: userDbAfter.email, name: body.name });
    expect(userDbAfter).to.be.deep.eq({ ...userDbBefore, name: body.name });
  });

  it('should change all personal fields', async () => {
    const data = { id: userId, email: 'admin@taqtile.com.br', name: 'Admin Taqtile', password: hashedPassword, salt };
    const userDbBefore = await client.create({ data });

    requestMaker.auth({ id: userId });
    const body = { name: 'Admin Taqtile da Silva', oldPassword: password, password: '4321Qwer@' };
    const response = await requestMaker.patch({ endpoint, body });

    const userDbAfter = (await client.findUnique({ where: { id: userId } }))!;
    expect(response.data).to.be.deep.eq({ id: userDbAfter.id, email: userDbAfter.email, name: body.name });
    expect(userDbAfter).to.be.deep.eq({
      ...userDbBefore,
      name: body.name,
      password: await CryptoService.generateHashWithSalt(body.password!, salt),
    });
  });

  it('should give an error if trying to change password without sending the old one', async () => {
    const data = { id: userId, email: 'admin@taqtile.com.br', name: 'Admin Taqtile', password: hashedPassword, salt };
    const userDbBefore = await client.create({ data });

    requestMaker.auth({ id: userId });
    const body = { password: '4321Qwer@' };
    const response = await requestMaker.patch({ endpoint, body, expectedStatus: 403 });

    const userDbAfter = (await client.findUnique({ where: { id: userId } }))!;
    expect(userDbAfter).to.be.deep.eq(userDbBefore);
    checkErrors(response, [UserErrors.InvalidOldPassword]);
  });

  it('should give an error if old password does not match', async () => {
    const data = { id: userId, email: 'admin@taqtile.com.br', name: 'Admin Taqtile', password: hashedPassword, salt };
    const userDbBefore = await client.create({ data });

    requestMaker.auth({ id: userId });
    const body = { oldPassword: '1234qwer@', password: '4321Qwer@' };
    const response = await requestMaker.patch({ endpoint, body, expectedStatus: 403 });

    const userDbAfter = (await client.findUnique({ where: { id: userId } }))!;
    expect(userDbAfter).to.be.deep.eq(userDbBefore);
    checkErrors(response, [UserErrors.InvalidOldPassword]);
  });

  it('should give an error if user is deleted', async () => {
    const data = { id: userId, email: 'admin@taqtile.com.br', name: 'Admin Taqtile', password: hashedPassword, salt };
    await client.create({ data: { ...data, deletedAt: new Date() } });

    requestMaker.auth({ id: userId });
    const body = { name: 'Admin Taqtile da Silva' };
    const response = await requestMaker.patch({ endpoint, body, expectedStatus: 404 });

    checkErrors(response, [UserErrors.NotFound]);
  });

  it('should give an error if new password does not follow the rules', async () => {
    const data = { id: userId, email: 'admin@taqtile.com.br', name: 'Admin Taqtile', password: hashedPassword, salt };
    await client.create({ data });

    requestMaker.auth({ id: userId });
    const body = { oldPassword: password, password: '4321Qwer' };
    const response = await requestMaker.patch({ endpoint, body, expectedStatus: 422 });

    checkErrors(response, [{ code: 'VAL_01', message: 'users.error.invalid-password' }]);
  });

  it('should give an error if unauthorized user', async () => {
    const data = { id: userId, email: 'admin@taqtile.com.br', name: 'Admin Taqtile', password: hashedPassword, salt };
    await client.create({ data });

    const body = { oldPassword: password, password: '4321Qwer@' };
    const response = await requestMaker.patch({ endpoint, body, expectedStatus: 401 });

    checkErrors(response, [AuthErrors.Unauthorized]);
  });
});
