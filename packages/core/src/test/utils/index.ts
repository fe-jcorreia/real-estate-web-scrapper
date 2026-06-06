/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai';

export function isDefined<T>(value: T): asserts value is NonNullable<T> {
  expect(value).to.not.be.null;
  expect(value).to.not.be.undefined;
}
