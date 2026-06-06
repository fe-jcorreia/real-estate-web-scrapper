import { customAlphabet } from 'nanoid';

const NANO_ID_DEFAULT_SIZE = 8;
const NANO_ID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const generateId = customAlphabet(NANO_ID_ALPHABET, NANO_ID_DEFAULT_SIZE);

/**
 * Used to generate a unique external id for a database entity.
 * Use this calculator for collision probability: https://zelark.github.io/nano-id-cc/
*/
function generate(prefix: string, size = NANO_ID_DEFAULT_SIZE) {
  return prefix + generateId(size);
}

export const DatabaseIdGenerator = { generate };
