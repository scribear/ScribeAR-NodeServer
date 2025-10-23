import { createBaseServer } from '@scribear/base-fastify-server';

import type AppConfig from '../app_config/app_config.js';

/**
 * Initializes fastify server
 * @param config Application config
 * @returns Initialized fastify server
 */
function createServer(config: AppConfig) {
  const { logger, fastify } = createBaseServer(config.logLevel);

  return { logger, fastify };
}

export default createServer;
