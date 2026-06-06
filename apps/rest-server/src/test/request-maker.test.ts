import type { ErrorBody } from '@api/common/common.schema.js';
import type { JwtPayload } from '@domain/model/auth.model.js';
import { Env } from '@env';
import { HttpClient, type HttpClientOptions, type HttpClientResponse } from '@repo/core/data';
import { JwtService } from '@repo/core/security';
import { expect } from 'chai';

type RestResponse<Response> = Response & { errors: ErrorBody[] };
export type HttpResponse<Response> = HttpClientResponse<RestResponse<Response>>;

interface RequestOptions<Body extends Record<string, any> | undefined> {
  endpoint: string;
  expectedStatus?: number;
  body?: Body;
  query?: any;
}

export class RequestMaker<Response, Body extends Record<string, any> | undefined = undefined> {
  private readonly baseOptions: Partial<HttpClientOptions<Response>> = {
    baseURL: `http://127.0.0.1:${Env.PORT}`,
    skipStatusValidation: true,
  };

  private token: string | null = null;

  auth(payload: JwtPayload): void {
    this.token = JwtService.sign(payload);
  }

  post({ endpoint, expectedStatus = 201, body, query }: RequestOptions<Body>): Promise<HttpResponse<Response>> {
    return this.request({ method: 'POST', url: endpoint, body, query, responseSchema: null }, expectedStatus);
  }

  get({ endpoint, expectedStatus = 200, query }: RequestOptions<Body>): Promise<HttpResponse<Response>> {
    return this.request({ method: 'GET', url: endpoint, query, responseSchema: null }, expectedStatus);
  }

  put({ endpoint, expectedStatus = 200, body, query }: RequestOptions<Body>): Promise<HttpResponse<Response>> {
    return this.request({ method: 'PUT', url: endpoint, body, query, responseSchema: null }, expectedStatus);
  }

  patch({ endpoint, expectedStatus = 200, body, query }: RequestOptions<Body>): Promise<HttpResponse<Response>> {
    return this.request({ method: 'PATCH', url: endpoint, body, query, responseSchema: null }, expectedStatus);
  }

  delete({ endpoint, expectedStatus = 200, body, query }: RequestOptions<Body>): Promise<HttpResponse<Response>> {
    return this.request({ method: 'DELETE', url: endpoint, body, query, responseSchema: null }, expectedStatus);
  }

  private async request(
    options: HttpClientOptions<RestResponse<Response>>,
    expectedStatus = 200,
  ): Promise<HttpResponse<Response>> {
    options = { ...this.baseOptions, ...options, responseSchema: null };

    if (this.token) {
      options.headers = { authorization: this.token };
    }

    const response = await HttpClient.request<RestResponse<Response>>(options);
    this.token = null;
    const expectMessage = `Expected status ${expectedStatus}: ${JSON.stringify(response.data)}`;
    expect(response.status).to.be.eq(expectedStatus, expectMessage);

    return response;
  }
}
