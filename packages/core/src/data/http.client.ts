import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse, type RawAxiosRequestHeaders } from 'axios';
import { ZodError, type ZodType } from 'zod';
import { DataSourceError, InvalidDataError } from '../error/index.js';
import { ApplicationLayer, logger } from '../log/index.js';

export type HttpMethods = 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH';

export interface HttpClientOptions<Output> {
  method: HttpMethods;
  url: string;
  responseSchema: ZodType<Output> | null;
  baseURL?: string;
  body?: Record<string, any>;
  query?: Record<string, any>;
  headers?: any;
  timeout?: number;
  auth?: { username: string; password: string };
  binaryResponse?: boolean;
  uuid?: string;
  skipStatusValidation?: boolean;
  paramsSerializer?: (params: any) => string;
}

export interface HttpClientResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  request?: {
    method?: string;
    url?: string;
    body?: Record<string, any> | string;
    query?: Record<string, any>;
    headers?: RawAxiosRequestHeaders;
  };
}

const DEFAULT_TIMEOUT = 120000; // 2 minutes

async function request<Output>(options: HttpClientOptions<Output>): Promise<HttpClientResponse<Output>> {
  const { baseURL, method, url, body, query, timeout, headers, auth, binaryResponse } = options;

  const axiosOptions: AxiosRequestConfig = {
    baseURL,
    method,
    url,
    data: body,
    params: query,
    headers,
    auth,
    timeout: timeout ?? DEFAULT_TIMEOUT,
    validateStatus: options.skipStatusValidation ? () => true : status => status >= 200 && status < 300,
    paramsSerializer: {
      serialize: options.paramsSerializer,
    },
  };

  if (binaryResponse) {
    axiosOptions.responseType = 'arraybuffer';
    axiosOptions.responseEncoding = 'binary';
  }

  let response: AxiosResponse<Output> | undefined;
  try {
    response = await axios.request<Output>(axiosOptions);
    return mapHttpClientResponse(response, options.responseSchema);
  } catch (error) {
    if (response) {
      logger.warn({
        message: 'Response schema validation error.',
        layer: ApplicationLayer.Data,
        method: 'HttpClient.request',
        body: response.data,
      });
    }

    logError(error, options);
    return handleError<Output>(error);
  }
}

function handleError<Output>(error: any): never {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNREFUSED') {
      throw new DataSourceError({ details: 'ECONNREFUSED' });
    }

    if (error.code === 'ECONNABORTED') {
      throw new DataSourceError({ details: 'ECONNABORTED' });
    }

    throw new DataSourceError({ details: error?.response ? mapHttpClientResponse<Output>(error?.response) : null });
  } else if (error instanceof ZodError) {
    throw new DataSourceError({ details: error });
  } else {
    throw new InvalidDataError({ details: error });
  }
}

function mapHttpClientResponse<Output>(
  response: AxiosResponse<Output>,
  responseSchema?: ZodType<Output> | null,
): HttpClientResponse<Output> {
  return {
    data: responseSchema?.parse(response.data) ?? response.data,
    status: response.status,
    headers: response.headers as any,
    request: {
      method: response.config.method,
      url: response.config.url,
      body: safeJsonParse(response.config?.data),
      query: response.config?.params,
      headers: response.config?.headers,
    },
  };
}

function safeJsonParse(value: any): Record<string, any> | undefined {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function logError(error: any, options: HttpClientOptions<any>) {
  let errorToLog = error;

  if (error.response) {
    const { request: _, auth: __, ...response } = error.response;
    errorToLog = { ...response };
  }

  errorToLog.config = { method: options.method, url: (options.baseURL ?? '') + options.url };

  logger.warn(errorToLog);
}

export const HttpClient = { request };
