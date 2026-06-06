import jwt, { decode as decodeJwt } from 'jsonwebtoken';
import { InternalServerError } from '../../error/index.js';
import { logger } from '../../log/index.js';

export interface JwtToken<T> {
  data: T;
  iat: number;
  exp: number;
}

interface JwtConfig {
  secret: string;
  expiration: string;
}

const BEARER: string = 'Bearer ';

let expiration: string;
let secret: string;

function configure(config: JwtConfig): void {
  secret = config.secret;
  expiration = config.expiration;
}

function decode<T>(token: string): JwtToken<T> | null {
  checkConfig();

  try {
    const splitToken = token.replace(BEARER, '');
    return decodeJwt(splitToken) as JwtToken<T>;
  } catch (err) {
    logger.debug('Invalid JWT token (verify): ', err.message);
    return null;
  }
}

function verify<T>(token: string, secretOrPublicKey?: string | Buffer): JwtToken<T> | null {
  checkConfig();

  try {
    const splitToken = token.replace(BEARER, '');
    return jwt.verify(splitToken, secretOrPublicKey ? secretOrPublicKey : secret) as JwtToken<T>;
  } catch (err) {
    logger.debug('Invalid JWT token (verify): ', err.message);
    return null;
  }
}

function sign<T>(payload: T, addBearer = true): string {
  checkConfig();

  let signedToken = jwt.sign({ data: payload }, secret, { expiresIn: expiration });

  if (addBearer) {
    signedToken = BEARER + signedToken;
  }

  return signedToken;
}

function checkConfig() {
  if (!logger || !expiration || !secret) {
    throw new InternalServerError({ details: 'JWT configuration is not set' });
  }
}

export const JwtService = { configure, decode, verify, sign };
