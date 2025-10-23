import { createBaseServer } from '@scribear/base-fastify-server';

import type AppConfig from '../app_config/app_config.js';
import registerDependencies from './dependency_injection/register_dependencies.js';
import swagger from './plugins/swagger.js';

/**
 * Initializes fastify server and registers dependencies
 * @param config Application config
 * @returns Initialized fastify server
 */
async function createServer(config: AppConfig) {
  const { logger, dependencyContainer, fastify } = createBaseServer(
    config.logLevel,
  );

  // Only include swagger docs if in development mode
  if (config.isDevelopment) {
    await fastify.register(swagger);
  }

  registerDependencies(dependencyContainer, config);

  return { logger, fastify };
}

export default createServer;
