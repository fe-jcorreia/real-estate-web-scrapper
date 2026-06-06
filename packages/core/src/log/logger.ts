import { type Logger as WinstonLogger, createLogger, format, transports } from 'winston';
import { ContextProvider } from '../context/index.js';

export enum ApplicationLayer {
  Core = 'Core',
  Api = 'Api',
  Domain = 'Domain',
  Data = 'Data',
}

interface LogErrorParams extends BaseLogParams {
  error: Error;
}

interface LogParams extends BaseLogParams {
  message?: string;
}

interface BaseLogParams {
  className?: string;
  method: string;
  layer: ApplicationLayer;
  [key: string]: any;
}

export type LogType = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export class Logger {
  private logger: WinstonLogger;
  private logLevel: LogType;

  constructor(logLevel: LogType) {
    this.logLevel = logLevel;
    this.setupWinston();
  }

  debug(params: LogParams): void;
  debug(params: string, ...additionalParams: string[]): void;
  debug(params: any, ...additionalParams: any[]): void {
    this.log('debug', params, ...additionalParams);
  }

  info(params: LogParams): void;
  info(params: string, ...additionalParams: string[]): void;
  info(params: any, ...additionalParams: any[]): void {
    this.log('info', params, ...additionalParams);
  }

  warn(params: LogParams): void;
  warn(params: LogErrorParams): void;
  warn(params: string, ...additionalParams: string[]): void;
  warn(params: any, ...additionalParams: any[]): void {
    this.log('warn', params, ...additionalParams);
  }

  error(params: LogErrorParams): void;
  error(params: string, ...additionalParams: string[]): void;
  error(params: any, ...additionalParams: any[]): void {
    this.log('error', params, ...additionalParams);
  }

  private log(level: string, payload: string | LogParams | LogErrorParams, ...additionalParams: any[]): void {
    const context = ContextProvider.getInstance<any>().get();

    if (typeof payload === 'string') {
      this.logger.log({
        level,
        message: payload + additionalParams?.join(' '),
        ...context,
      });
    } else {
      const { error, ...additionalInfo } = payload;
      this.logger.log({
        level,
        message: error || this.composeLogMessage(additionalInfo),
        ...additionalInfo,
        ...additionalParams,
        ...context,
      });
    }
  }

  private composeLogMessage(info: LogParams): string {
    let baseMessage = `[${info.layer}] [${info.className ?? 'global'}.${info.method}]`;
    if (info.message) {
      baseMessage += info.message;
    }
    return baseMessage;
  }

  private setupWinston(): void {
    this.logger = createLogger({
      level: this.logLevel,
      format: format.combine(format.errors({ stack: true })),
      transports: [],
    });

    this.logger.add(
      new transports.Console({
        format: format.combine(format.timestamp(), format.colorize(), format.simple()),
      }),
    );
  }
}
