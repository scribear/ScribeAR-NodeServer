import {pino} from 'pino';
import type {ConfigType} from '../config/config-schema.js';

export type Logger = pino.Logger;

/**
 * Creates a logger instance using app configuration
 * @param config configuration object
 * @returns logger instance
 */
export default function createLogger(config: ConfigType): Logger {
  const logger = pino({
    level: config.log.level,
    serializers: {err: pino.stdSerializers.errWithCause},
  });
  return logger;
}
