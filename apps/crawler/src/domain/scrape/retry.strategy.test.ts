import { expect } from 'chai';
import { describe, it } from 'mocha';
import { detectBlockReason } from './retry.strategy.js';

describe('detectBlockReason', () => {
  it('detects 429 as rate-limit', () => {
    expect(detectBlockReason(new Error('API 429: Too Many Requests'))).to.equal('rate-limit');
  });

  it('detects 403 as forbidden', () => {
    expect(detectBlockReason(new Error('API 403 for core'))).to.equal('forbidden');
  });

  it('detects 408 as timeout', () => {
    expect(detectBlockReason(new Error('API 408 for detail'))).to.equal('timeout');
  });

  it('detects timeout string as timeout', () => {
    expect(detectBlockReason(new Error('Request timed out'))).to.equal('timeout');
  });

  it('detects captcha as captcha', () => {
    expect(detectBlockReason(new Error('Captcha challenge detected'))).to.equal('captcha');
  });

  it('returns unknown for unrecognized errors', () => {
    expect(detectBlockReason(new Error('Something went wrong'))).to.equal('unknown');
  });

  it('handles non-Error values', () => {
    expect(detectBlockReason('rate limit exceeded')).to.equal('rate-limit');
  });
});
