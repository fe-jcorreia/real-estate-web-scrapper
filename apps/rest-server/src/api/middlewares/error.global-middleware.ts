import type { ErrorBody } from '@api/common/common.schema.js';
import { isValidationError, mapValidationErrors } from '@api/common/error.mapper.js';
import type { ServerContext } from '@domain/model/context.model.js';
import { ContextProvider } from '@repo/core/context';
import { isBaseError } from '@repo/core/error';
import { Localization } from '@repo/core/localization';
import { logger } from '@repo/core/log';
import type { FastifyReply } from 'fastify';

export function parseGlobalError(error: any, _, reply: FastifyReply) {
  logger.error(error);

  const uuid = ContextProvider.getInstance<ServerContext>().get()?.uuid;
  const errors: ErrorBody[] = [];
  let status = 500;

  if (isBaseError(error)) {
    status = error.status;
    errors.push({
      code: error.code,
      message: Localization.__(error.message),
      uuid,
      details: error.details,
    });
  } else if (isValidationError(error.validation)) {
    const validation = mapValidationErrors(error.validation);
    status = validation.status;
    errors.push(...validation.errors.map(err => ({ ...err, uuid })));
  } else {
    errors.push({
      code: 'GLB_01',
      message: Localization.__('global.error.generic'),
      uuid,
      details: error.message,
    });
  }

  reply.status(status).send({ errors });
}
