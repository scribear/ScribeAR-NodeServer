import fs from 'fs';
import Fastify, {type FastifyInstance} from 'fastify';
import fastifyCors from '@fastify/cors';
import type {ConfigType} from '../shared/config/config_schema.js';
import type {Logger} from '../shared/logger/logger.js';
import TranscriptionEngine from './services/transcription_engine.js';
import fastifyWebsocket from '@fastify/websocket';
import websocketHandler from './routes/websocket_handler.js';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import RequestAuthorizer from './services/request_authorizer.js';
import accessTokenHandler from './routes/session_auth_handler.js';

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
  let fastify: FastifyInstance;
  if (config.server.useHttps) {
    fastify = Fastify({
      loggerInstance: logger,
      https: {
        key: fs.readFileSync(config.server.keyPath),
        cert: fs.readFileSync(config.server.certPath),
      },
    }) as unknown as FastifyInstance;
  } else {
    fastify = Fastify({loggerInstance: logger}) as unknown as FastifyInstance;
  }

  fastify.register(fastifyWebsocket);

  fastify.register(fastifyCors, {
    origin: config.server.corsOrigin,
    methods: ['GET', 'POST'],
  });

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
