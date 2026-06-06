export interface ErrorFields {
  /** A code that is unique for a type of error. Ex: "GLB_01" */
  code?: string;
  message?: string;
  details?: any;
}

interface BaseErrorFields extends ErrorFields {
  status: number;
}

export const BaseErrorToken = Symbol();

export class BaseError<T = any> extends Error {
  [BaseErrorToken] = true;
  status: number;
  code: string;
  details?: T;

  constructor({ status = 500, code = 'GLB_01', message = 'global.error.generic', details }: BaseErrorFields) {
    super(message);

    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isBaseError(error: any): error is BaseError {
  return error?.[BaseErrorToken] ?? false;
}
