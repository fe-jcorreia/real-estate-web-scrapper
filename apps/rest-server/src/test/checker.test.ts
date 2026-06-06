import type { ErrorFields } from '@repo/core/error';
import { Localization } from '@repo/core/localization';
import { expect } from 'chai';
import type { HttpResponse } from './request-maker.test.js';

export function checkErrors<T>(response: HttpResponse<T>, expectedErrors: ErrorFields[]) {
  expect(response.data.errors).to.have.lengthOf(expectedErrors.length);

  response.data.errors.forEach((error, index) => {
    const { uuid, details, ...errorFields } = error;
    const expectedError = expectedErrors[index];
    expect(errorFields).to.be.deep.eq({ code: expectedError!.code, message: Localization.__(expectedError!.message!) });
  });
}
