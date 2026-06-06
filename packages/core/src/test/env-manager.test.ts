import { expect } from 'chai';
import { EnvManager } from './env-manager.js';

describe('EnvManager', () => {
  const key = 'this-is-a-unique-key';

  afterEach(() => {
    delete process.env[key];
  });

  it('should set a value in process.env', () => {
    const manager = new EnvManager();

    manager.set(key, key);
    expect(process.env[key]).to.be.eq(key);
  });

  it('should stringify the value automatically while setting it into process.env', () => {
    const manager = new EnvManager();

    const value = { bool: true, num: 4, obj: { bool: false } };
    manager.set(key, value);
    expect(process.env[key]).to.be.eq(JSON.stringify(value));
  });

  it('should restore the original process.env value', () => {
    const originalValue = 'original value';
    process.env[key] = originalValue;

    const manager = new EnvManager();
    manager.set(key, key);
    expect(process.env[key]).to.be.eq(key);

    manager.restoreAll();
    expect(process.env[key]).to.be.eq(originalValue);
  });
});
