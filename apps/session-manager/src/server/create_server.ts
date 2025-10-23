import { createBaseServer } from '@scribear/base-fastify-server';

import type AppConfig from '../app_config/app_config.js';
import swagger from './plugins/swagger.js';

/**
 * Initializes fastify server
 * @param config Application config
 * @returns Initialized fastify server
 */
async function createServer(config: AppConfig) {
  const { logger, fastify } = createBaseServer(config.logLevel);

  // Only include swagger docs if in development mode
  if (config.isDevelopment) {
    await fastify.register(swagger);
  }

  return { logger, fastify };
}

export default createServer;
