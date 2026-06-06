import { BaseError, type ErrorFields } from './base.error.js';

export class DataSourceError<T = unknown> extends BaseError<T> {
  constructor(fields: ErrorFields) {
    super({ ...fields, status: 500 });
  }
}
