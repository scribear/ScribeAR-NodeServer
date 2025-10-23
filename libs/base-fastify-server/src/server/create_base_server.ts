import fastifyHelmet from '@fastify/helmet';
import { fastifySensible } from '@fastify/sensible';
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import { v4 as uuidv4 } from 'uuid';

import type { BaseLogger, LogLevel } from './create_logger.js';
import { createLogger } from './create_logger.js';

/**
 * Creates fastify server, logger, and loads default plugins
 * @param logLevel Minimum log severity level for created logger
 * @param fastifyConfig Additional options for fastify server
 * @returns object containing fastify server and logger
 */
function createBaseServer(
  logLevel: LogLevel,
  fastifyConfig?: FastifyServerOptions,
): {
  logger: BaseLogger;
  fastify: FastifyInstance;
} {
  const logger = createLogger(logLevel);

  const fastify = Fastify({
    loggerInstance: logger,
    ...fastifyConfig,
  });

  // Use UUIDv4 for request ids
  fastify.setGenReqId(() => uuidv4());

  // Register plugins
  fastify.register(fastifySensible);
  fastify.register(fastifyHelmet);

  return {
    logger,
    fastify: fastify,
  };
}

export default createBaseServer;
