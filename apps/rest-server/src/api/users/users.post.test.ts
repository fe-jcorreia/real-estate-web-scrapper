import type { User, UserInput } from '@domain/model/users.model.js';
import { UserErrors } from '@domain/users/users.error.js';
import { CryptoService } from '@repo/core/security';
import { DatabaseIdGenerator, type Prisma, clearDatabase, dbClient } from '@repo/db';
import { checkErrors } from '@test/checker.test.js';
import { RequestMaker } from '@test/request-maker.test.js';
import { expect } from 'chai';
import sinon from 'sinon';

describe('POST /users', () => {
  const endpoint = '/users';
  const salt = 'salt';
  const userId = 'u_123';

  let requestMaker: RequestMaker<User, UserInput>;
  let client: Prisma.UserEntityDelegate;

  before(async () => {
    requestMaker = new RequestMaker();
    client = dbClient.userEntity;

    sinon.stub(CryptoService, 'generateRandomPassword').returns(salt);
    sinon.stub(DatabaseIdGenerator, 'generate').returns(userId);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  after(() => {
    sinon.restore();
  });

  it('should create user successfully', async () => {
    const body = { email: 'admin@taqtile.com.br', name: 'Admin Taqtile da Silva', password: '1234Qwer@' };
    const response = await requestMaker.post({ endpoint, body });

    const userDb = (await client.findUnique({ where: { email: body.email } }))!;
    expect(response.data).to.be.deep.eq({ id: userDb.id, email: body.email, name: body.name });
    expect(userDb.id).to.be.eq(userId);
    expect(userDb.email).to.be.eq(body.email);
    expect(userDb.name).to.be.eq(body.name);
    expect(userDb.salt).to.be.eq(salt);
    expect(userDb.password).to.be.eq(await CryptoService.generateHashWithSalt(body.password, salt));
  });

  it('should give an error if email is already registered', async () => {
    const body = { email: 'admin@taqtile.com.br', name: 'Admin Taqtile', password: '1234Qwer@' };
    await client.create({ data: { ...body, id: 'u_123', salt, password: '' } });

    const response = await requestMaker.post({ endpoint, body, expectedStatus: 409 });

    checkErrors(response, [UserErrors.AlreadyRegistered]);
  });

  it('should give an error if email has wrong format', async () => {
    const body = { email: '@taqtile.com.br', name: 'Admin Taqtile', password: '1234Qwer@' };
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 422 });

    checkErrors(response, [{ code: 'VAL_01', message: 'users.error.invalid-email' }]);
  });

  it('should give an error if name is not complete', async () => {
    const body = { email: 'admin@taqtile.com.br', name: 'Admin', password: '1234Qwer@' };
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 422 });

    checkErrors(response, [{ code: 'VAL_01', message: 'users.error.invalid-name' }]);
  });

  it('should give an error if password does not follow the rules', async () => {
    const body = { email: 'admin@taqtile.com.br', name: 'Admin Taqtile', password: '123456789' };
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 422 });

    checkErrors(response, [{ code: 'VAL_01', message: 'users.error.invalid-password' }]);
  });

  it('should give an error if password is not sent', async () => {
    const body = { email: 'admin@taqtile.com.br', name: 'Admin Taqtile' } as any;
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 400 });

    checkErrors(response, [{ code: 'VAL_01', message: 'global.error.generic' }]);
  });

  it('should give multiple errors if more than one field do not follow the rules', async () => {
    const body = { email: '', name: '', password: '' };
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 422 });

    checkErrors(response, [
      { code: 'VAL_01', message: 'users.error.invalid-email' },
      { code: 'VAL_01', message: 'users.error.invalid-name' },
      { code: 'VAL_01', message: 'users.error.invalid-password' },
    ]);
  });

  it('should give an error if a required field is missing', async () => {
    const body = { name: 'Admin Taqtile', password: '1234Qwer@' } as any;
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 400 });

    checkErrors(response, [{ code: 'VAL_01', message: 'users.error.invalid-email' }]);
  });
});
