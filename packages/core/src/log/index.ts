import { type LogType, Logger } from './logger.js';

export * from './logger.js';

export let logger: Logger;

export function configureLogger(level: LogType) {
  logger = new Logger(level);
}
