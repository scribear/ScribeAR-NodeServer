import Fastify from 'fastify';
import type {ConfigType} from '../shared/config/config-schema.js';
import type {Logger} from '../shared/logger/logger.js';
import TranscriptionEngine from './services/transcription-engine.js';
import fastifyWebsocket from '@fastify/websocket';
import websocketHandler from './routes/websocket-handler.js';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import RequestAuthorizer from './services/request-authorizer.js';
import accessTokenHandler from './routes/session-auth-handler.js';

declare module 'fastify' {
  export interface FastifyInstance {
    config: ConfigType;
    transcriptionEngine: TranscriptionEngine;
    requestAuthorizer: RequestAuthorizer;
  }
}

/**
 * Creates fastify server and loads all plugins, hooks, and modules from corresponding folders
 * @returns created fastify server
 */
export default function createServer(config: ConfigType, logger: Logger) {
  const fastify = Fastify({loggerInstance: logger});

  fastify.register(fastifyWebsocket);

  // Security and sensible defaults
  fastify.register(fastifyHelmet);
  fastify.register(fastifySensible);

  // Make configuration and transcription engine avaiable on fastify instance (dependency injection)
  fastify.decorate('config', config);
  fastify.decorate('transcriptionEngine', new TranscriptionEngine(config, logger));
  fastify.decorate('requestAuthorizer', new RequestAuthorizer(config, logger));

  // Register routes
  fastify.register(websocketHandler);
  fastify.register(accessTokenHandler);

  return fastify;
}
