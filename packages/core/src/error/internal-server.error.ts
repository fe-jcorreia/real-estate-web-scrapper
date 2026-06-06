import { BaseError, type ErrorFields } from './base.error.js';

export class InternalServerError<T> extends BaseError<T> {
  constructor(fields: ErrorFields) {
    super({ ...fields, status: 500 });
  }
}
