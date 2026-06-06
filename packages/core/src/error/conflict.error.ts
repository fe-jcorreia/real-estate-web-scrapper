import { BaseError, type ErrorFields } from './base.error.js';

export class ConflictError<T = unknown> extends BaseError<T> {
  constructor(fields: ErrorFields) {
    super({ ...fields, status: 409 });
  }
}
