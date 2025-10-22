import { asValue } from 'awilix';

import { createBaseServer } from '@scribear/base-fastify-server';

import type AppConfig from '../app_config/app_config.js';
import registerDependencies from './dependency_injection/register_dependencies.js';
import calculatorRouter from './features/calculator/calculator.router.js';
import healthcheckRouter from './features/healthcheck/healthcheck.router.js';
import swagger from './plugins/swagger.js';

/**
 * Initializes fastify server amd registers dependencies and routes
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

  // Register dependencies with container
  dependencyContainer.register({ config: asValue(config) });
  registerDependencies(dependencyContainer);

  // Register routes
  fastify.register(healthcheckRouter);
  fastify.register(calculatorRouter);

  return { logger, fastify };
}

export default createServer;
