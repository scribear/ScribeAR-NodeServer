import Fastify from 'fastify';
import type {ConfigType} from '../shared/config/config-schema.js';
import type {Logger} from '../shared/logger/logger.js';
import TranscriptionEngine from './services/transcription-engine.js';
import fastifyWebsocket from '@fastify/websocket';
import websocketHandler from './routes/websocket-handler.js';

declare module 'fastify' {
  export interface FastifyInstance {
    config: ConfigType;
    transcriptionEngine: TranscriptionEngine;
  }
}

/**
 * Creates fastify server and loads all plugins, hooks, and modules from corresponding folders
 * @returns
 */
export default function createServer(config: ConfigType, logger: Logger) {
  const fastify = Fastify({
    loggerInstance: logger,
  });

  fastify.register(fastifyWebsocket);

  fastify.decorate('config', config);

  fastify.decorate('transcriptionEngine', new TranscriptionEngine(config, logger));

  fastify.register(websocketHandler);

  return fastify;
}
