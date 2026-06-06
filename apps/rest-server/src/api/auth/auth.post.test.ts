import { AuthErrors } from '@domain/auth/auth.error.js';
import type { Auth, AuthInput } from '@domain/model/auth.model.js';
import { CryptoService, JwtService } from '@repo/core/security';
import { type Prisma, clearDatabase, dbClient } from '@repo/db';
import { checkErrors } from '@test/checker.test.js';
import { RequestMaker } from '@test/request-maker.test.js';
import { expect } from 'chai';

describe('POST /auth', () => {
  const endpoint = '/auth';
  const salt = 'salt';
  const userData = { id: 'u_123', email: 'admin@taqtile.com.br', name: 'Admin Taqtile', password: '1234Qwer@' };

  let requestMaker: RequestMaker<Auth, AuthInput>;
  let client: Prisma.UserEntityDelegate;

  before(() => {
    requestMaker = new RequestMaker();
    client = dbClient.userEntity;
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it('should authentiacate user successfully', async () => {
    const password = await CryptoService.generateHashWithSalt(userData.password, salt);
    const user = await client.create({ data: { ...userData, salt, password } });

    const body = { email: userData.email, password: userData.password };
    const response = await requestMaker.post({ endpoint, body });

    expect(response.data).to.be.deep.equal({
      token: JwtService.sign({ id: user.id }),
      user: { id: user.id, name: user.name, email: user.email },
    });
  });

  it('should give an error if user is deleted', async () => {
    const password = await CryptoService.generateHashWithSalt(userData.password, salt);
    await client.create({ data: { ...userData, salt, password, deletedAt: new Date() } });

    const body = { email: userData.email, password: userData.password };
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 401 });

    checkErrors(response, [AuthErrors.Credentials]);
  });

  it('should give an error if email is not found', async () => {
    const password = await CryptoService.generateHashWithSalt(userData.password, salt);
    await client.create({ data: { ...userData, salt, password } });

    const body = { email: 'another-email@taqtile.com.br', password: userData.password };
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 401 });

    checkErrors(response, [AuthErrors.Credentials]);
  });

  it('should give an error if password is wrong', async () => {
    const password = await CryptoService.generateHashWithSalt(userData.password, salt);
    await client.create({ data: { ...userData, salt, password } });

    const body = { email: userData.email, password: 'wrong-password' };
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 401 });

    checkErrors(response, [AuthErrors.Credentials]);
  });

  it('should give an error if email has wrong format', async () => {
    const body = { email: '@taqtile.com.br', password: 'wrong-password' };
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 422 });

    checkErrors(response, [{ code: 'VAL_01', message: 'users.error.invalid-email' }]);
  });
});
