import Fastify, {type FastifyInstance} from 'fastify';
import fastifyCors from '@fastify/cors';
import type {ConfigType} from '../shared/config/config_schema.js';
import type {Logger} from '../shared/logger/logger.js';
import TranscriptionEngine from './services/transcription_engine.js';
import fastifyWebsocket from '@fastify/websocket';
import websocketHandler from './routes/websocket_handler.js';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import TokenService from './services/token_service.js';
import accessTokenHandler from './routes/session_auth_handler.js';
import healthcheckHandler from './routes/healthcheck_handler.js';
import AuthenticationService from './services/authentication_service.js';

declare module 'fastify' {
  export interface FastifyInstance {
    config: ConfigType;
    authenticationService: AuthenticationService;
    transcriptionEngine: TranscriptionEngine;
    tokenService: TokenService;
  }

  export interface FastifyRequest {
    authorizationExpiryTimeout?: number;
  }
}

/**
 * Creates fastify server and loads all plugins, hooks, and modules from corresponding folders
 * @returns created fastify server
 */
export default function createServer(config: ConfigType, logger: Logger) {
  const fastify = Fastify({loggerInstance: logger}) as unknown as FastifyInstance;

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
  fastify.decorate('tokenService', new TokenService(config, logger));
  fastify.decorate('authenticationService', new AuthenticationService(config, fastify.tokenService));

  // Register routes
  fastify.register(websocketHandler);
  fastify.register(accessTokenHandler);
  fastify.register(healthcheckHandler);

  return fastify;
}
