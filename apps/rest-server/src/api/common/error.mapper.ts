import { Env } from '../../env/index.js';
import { RequestValidationError } from 'fastify-zod-openapi';
import type { ErrorBody } from './common.schema.js';

const ERROR_TYPE_TO_BAD_REQUEST = 'invalid_type';

interface ValidationErrors {
  status: number;
  errors: ErrorBody[];
}

export function isValidationError(validation: any): validation is RequestValidationError[] {
  return Array.isArray(validation) && validation.every(error => error instanceof RequestValidationError);
}

export function mapValidationErrors(validationErrors: RequestValidationError[]): ValidationErrors {
  const status = validationErrors.some(validation => validation.keyword === ERROR_TYPE_TO_BAD_REQUEST) ? 400 : 422;
  const errors = validationErrors.map(validation => ({
    code: 'VAL_01',
    message: validation.message,
    details: Env.OPEN_API_SCHEMA_VISIBLE ? validation.params : undefined,
  }));

  return { status, errors };
}
