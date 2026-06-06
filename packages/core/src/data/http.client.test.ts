import { expect } from 'chai';
import path from 'node:path';
import { URLSearchParams } from 'node:url';
import { ZodError, z } from 'zod';
import { Localization } from '../localization/localization.service.js';
import { configureLogger } from '../log/index.js';
import { type TestRoute, TestServer } from '../test/test-server.js';
import { HttpClient, type HttpMethods } from './http.client.js';

describe('HttpClient', () => {
  const dirname = import.meta.dirname ?? __dirname;

  let server: TestServer;
  let timeout: NodeJS.Timeout;

  before(() => {
    Localization.configure(path.join(dirname, '..', 'test', 'localization'));
    configureLogger('critical');
  });

  beforeEach(async () => {
    server = new TestServer();
    await server.start();
  });

  afterEach(async () => {
    await server.close();
    clearTimeout(timeout);
  });

  it('should send a request to a given endpoint', async () => {
    server.addRoute({
      route: '/',
      method: 'get',
      response: { body: 'Hello World!\n' },
    });

    const response = await HttpClient.request({
      method: 'GET',
      url: 'http://localhost:9999/',
      responseSchema: null,
    });

    expect(response.status).to.be.eq(200);
    expect(response.data).to.be.eq('Hello World!\n');
  });

  it('should accept all methods', async () => {
    for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
      server.addRoute({
        method: method.toLocaleLowerCase() as TestRoute['method'],
        route: '/user',
        response: {
          body: {
            id: '1',
          },
        },
      });
      const response = await HttpClient.request({
        method: method as HttpMethods,
        url: 'http://localhost:9999/user',
        responseSchema: null,
      });
      expect(response.status).to.be.eq(200);
      expect(response.data).to.be.deep.eq({ id: '1' });
    }
  });

  it('should send body', async () => {
    server.addRoute({
      method: 'post',
      route: '/body',
      handler: async (req, res) => {
        if (req.body.test === '1') {
          expect(req.headers['content-type']).to.be.eq('application/json');
          res.send({ body: 'ok' });
        } else {
          res.statusCode = 500;
          res.send({});
        }
      },
    });
    const response = await HttpClient.request({
      method: 'POST',
      url: 'http://localhost:9999/body',
      responseSchema: null,
      body: {
        test: '1',
      },
    });
    expect(response.status).to.be.eq(200);
    expect(response.data).to.be.deep.eq({ body: 'ok' });
    expect(response.request?.body).to.be.deep.eq({
      test: '1',
    });
  });

  it('should send x-www-form-urlencoded body', async () => {
    server.addRoute({
      method: 'post',
      route: '/body',
      handler: async (req, res) => {
        if (req.body.test === '1') {
          expect(req.headers['content-type']).to.be.eq('application/x-www-form-urlencoded;charset=utf-8');
          res.send({ body: 'ok' });
        } else {
          res.statusCode = 500;
          res.send({});
        }
      },
    });

    const body = new URLSearchParams();
    body.append('test', '1');

    const response = await HttpClient.request({
      method: 'POST',
      url: 'http://localhost:9999/body',
      responseSchema: null,
      body,
    });
    expect(response.status).to.be.eq(200);
    expect(response.data).to.be.deep.eq({ body: 'ok' });
    expect(response.request?.body).to.be.eq(body.toString());
  });

  it('should send query string', async () => {
    server.addRoute({
      method: 'get',
      route: '/user',
      handler: async (req, res) => {
        if (req.query.page === '1') {
          res.send({ body: 'ok' });
        } else {
          res.statusCode = 500;
          res.send({});
        }
      },
    });
    const response = await HttpClient.request({
      method: 'GET',
      url: 'http://localhost:9999/user',
      responseSchema: null,
      query: {
        page: 1,
      },
    });
    expect(response.status).to.be.eq(200);
    expect(response.data).to.be.deep.eq({ body: 'ok' });
  });

  it('should send patch request', async () => {
    server.addRoute({
      method: 'patch',
      route: '/user',
      handler: async (req, res) => {
        expect(req.body.data).to.be.eq(1);
        expect(req.query.queryData).to.be.eq('2');
        res.statusCode = 204;
        res.send();
      },
    });
    const response = await HttpClient.request({
      method: 'PATCH',
      url: 'http://localhost:9999/user',
      responseSchema: null,
      body: {
        data: 1,
      },
      query: {
        queryData: 2,
      },
    });
    expect(response.status).to.be.eq(204);
    expect(response.data).to.eq('');
  });

  it('should throw error if status code is above 400', done => {
    server.addRoute({
      method: 'get',
      route: '/400',
      response: {
        body: {
          message: 'error',
        },
        code: 400,
      },
    });

    HttpClient.request({
      method: 'GET',
      url: 'http://localhost:9999/400',
      responseSchema: null,
    })
      .then(() => {
        done('should not have completed');
      })
      .catch(err => {
        expect(err.details.status).to.be.eq(400);
        expect(err.details.data).to.be.deep.eq({
          message: 'error',
        });
        done();
      });
  });

  it('should throw error if timeout is reached', async () => {
    server.addRoute({
      method: 'get',
      route: '/timeout',
      handler: async (_req, res) => {
        timeout = setTimeout(() => {
          res.send('ok');
        }, 2000);
      },
    });
    try {
      await HttpClient.request({
        method: 'GET',
        url: 'http://localhost:9999/timeout',
        responseSchema: null,
        timeout: 1,
      });
      throw new Error('should not have completed');
    } catch (err) {
      expect(err.status).to.be.eq(500);
      expect(err.code).to.be.eq('GLB_01');
      expect(err.message).to.be.eq('global.error.generic');
      expect(err.details).to.be.eq('ECONNABORTED');
    }
  });

  it('should throw error if the given server is offline', async () => {
    await server.close();
    try {
      await HttpClient.request({
        method: 'GET',
        url: 'http://localhost:9999/',
        responseSchema: null,
      });
      throw new Error('should not have completed');
    } catch (err) {
      expect(err.status).to.be.eq(500);
      expect(err.code).to.be.eq('GLB_01');
      expect(err.message).to.be.eq('global.error.generic');
      expect(err.details).to.be.eq('ECONNREFUSED');
    }
  });

  it('should throw error if the given server is offline', async () => {
    await server.close();
    try {
      await HttpClient.request({
        method: 'GET',
        url: 'http://localhost:9999/',
        responseSchema: null,
      });
      throw new Error('should not have completed');
    } catch (err) {
      expect(err.status).to.be.eq(500);
      expect(err.code).to.be.eq('GLB_01');
      expect(err.message).to.be.eq('global.error.generic');
      expect(err.details).to.be.eq('ECONNREFUSED');
    }
  });

  it('should validate response schema', async () => {
    server.addRoute({
      route: '/',
      method: 'get',
      response: { body: { data: 'Hello World!\n' } },
    });

    const response = await HttpClient.request({
      method: 'GET',
      url: 'http://localhost:9999/',
      responseSchema: z.object({ data: z.string() }),
    });

    expect(response.status).to.be.eq(200);
    expect(response.data.data).to.be.eq('Hello World!\n');
  });

  it('should throw error because of response schema validation', async () => {
    try {
      server.addRoute({
        route: '/',
        method: 'get',
        response: { body: { data: 'Hello World!\n' } },
      });

      await HttpClient.request({
        method: 'GET',
        url: 'http://localhost:9999/',
        responseSchema: z.object({ data: z.number() }),
      });
    } catch (err) {
      expect(err.status).to.be.eq(500);
      expect(err.code).to.be.eq('GLB_01');
      expect(err.message).to.be.eq('global.error.generic');
      expect(err.details).to.be.instanceOf(ZodError);
    }
  });
});
