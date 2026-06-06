import { BaseError, type ErrorFields } from './base.error.js';

export class ForbiddenError<T = unknown> extends BaseError<T> {
  constructor(fields: ErrorFields) {
    super({ ...fields, status: 403 });
  }
}
