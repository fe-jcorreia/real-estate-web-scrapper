import * as crypto from 'node:crypto';
import { InternalServerError } from '../../error/index.js';

const SCRYPT_COST = process.env.NODE_ENV === 'test' ? 2 : 16384;

let cryptoSalt: string;
let defaultPasswordLength = 10;

function configure(salt: string) {
  cryptoSalt = salt;
}

function generateHash(value: string): Promise<string> {
  if (!cryptoSalt) {
    throw new InternalServerError({ details: 'Crypto salt not configured. Call `configureCrypto`.' });
  }

  return new Promise((resolve, reject) =>
    crypto.scrypt(value, cryptoSalt, 64, { cost: SCRYPT_COST }, (error, response) => {
      if (error) {
        reject(error);
      }

      resolve(response.toString('base64'));
    }),
  );
}

// Always use this function to generate passwords before saving it into the database
// for more info: https://www.youtube.com/watch?v=8ZtInClXe1Q
function generateHashWithSalt(value: string, salt: string): Promise<string> {
  if (!salt) {
    throw Error('Invalid salt');
  }

  if (!cryptoSalt) {
    throw new InternalServerError({ details: 'Crypto salt not configured. Call `configureCrypto`.' });
  }

  const passwordWithSalt = value + salt;
  return generateHash(passwordWithSalt);
}

function generateRandomPassword(): string {
  /*
    randomBytes method creates a password with the double size of our specified
    length: http://stackoverflow.com/a/27747377, because, actually, it sets the byte size, as it
    is hex type, it creates 2 character for eash byte. That's why we divide defaultPasswordLength by 2.
    Furthermore, we need to guard in case it's a odd number, also because hex type does not accept it.
    */
  if (defaultPasswordLength % 2) {
    defaultPasswordLength++;
    return crypto
      .randomBytes(defaultPasswordLength / 2)
      .toString('hex')
      .substring(1);
  } else {
    return crypto.randomBytes(defaultPasswordLength / 2).toString('hex');
  }
}

export const CryptoService = {
  hash: generateRandomPassword(),
  configure,
  generateHash,
  generateHashWithSalt,
  generateRandomPassword,
};
