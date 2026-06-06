import { expect } from 'chai';
import crypto from 'node:crypto';
import * as sinon from 'sinon';
import { CryptoService } from './crypto.service.js';

describe('CryptoService', () => {
  before(async () => {
    CryptoService.configure('defaultSalt');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should generate hash', async () => {
    const hash = await CryptoService.generateHash('this is a string');

    expect(hash).to.be.eq('4k03+LAsZ0+mcFAWnDmUqMdOTIdWtUWIkjNFRot1FvreyyiHmNw/ID2rLb3vZYa1V7OINZ7pV5u8os02rN0hNA==');
  });

  it('should generate hash with salt different from default', async () => {
    const value = 'this is a string';
    const hashWithDefaultSalt = await CryptoService.generateHash(value);
    const hashWithCustomSalt = await CryptoService.generateHashWithSalt(value, 'different-salt');

    expect(hashWithCustomSalt).not.to.be.eq(hashWithDefaultSalt);
    expect(hashWithCustomSalt).to.be.eq(
      'RxC1ICIwzrqKxd0w15I/7VA4it0MJsjxERM+taoK6lvB1B4tA+sl3dgkfvGtjpePFNI/WrjIfj7vzLusZbVSHw==',
    );
  });

  it('should throw exception if generate hash with salt has no salt', () => {
    expect(() => CryptoService.generateHashWithSalt('value', '')).to.throw('Invalid salt');
  });

  it('should generate a random password', () => {
    sinon.stub(crypto, 'randomBytes').callsFake(() => Buffer.from('random bytes'));
    const random = CryptoService.generateRandomPassword();
    expect(random).to.be.eq('72616e646f6d206279746573');
  });

  it('should generate an even random password with a password odd-length', () => {
    sinon.stub(crypto, 'randomBytes').callsFake(() => Buffer.from('random bytes'));
    const random = CryptoService.generateRandomPassword();
    expect(random).to.be.eq('2616e646f6d206279746573');
  });
});
