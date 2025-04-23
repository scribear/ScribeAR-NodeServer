import type {BackendTranscriptBlock} from '@server/services/transcription_engine.js';
import {FastifyInstance} from 'fastify';
import WebSocket from 'ws';

/**
 * Register a websocket that listens for transcription events and forwards them
 * Closes websocket when session becomes invalid
 * @param fastify fastify webserver instance
 * @param ws websocket to register
 */
function registerSink(fastify: FastifyInstance, ws: WebSocket) {
  const onTranscription = (block: BackendTranscriptBlock) => {
    try {
      ws.send(JSON.stringify(block));
    } catch {
      //
    }
  };

  fastify.transcriptionEngine.on('transcription', onTranscription);

  ws.on('close', () => {
    fastify.transcriptionEngine.removeListener('transcription', onTranscription);
  });
}

/**
 * Register a websocket that sends audio to be transcribed
 * Will throw error if a second websocket is registered before first has closed
 * @param fastify fastify webserver instance
 * @param ws websocket to register
 */
function registerSource(fastify: FastifyInstance, ws: WebSocket) {
  ws.on('message', data => {
    if (data instanceof Buffer) {
      try {
        fastify.transcriptionEngine.sendAudioChunk(data);
      } catch {
        //
      }
    }
  });
}

/**
 * Registers websocket endpoints for transcription source and sinks with fastify webserver
 * @param fastify
 */
export default function websocketHandler(fastify: FastifyInstance) {
  fastify.get('/sourcesink', {websocket: true, preHandler: fastify.requestAuthorizer.authorizeLocalhost}, (ws, req) => {
    registerSink(fastify, ws);
    registerSource(fastify, ws);

    ws.on('close', code => {
      req.log.info({msg: 'Websocket closed', code});
    });
  });

  fastify.get('/source', {websocket: true, preHandler: fastify.requestAuthorizer.authorizeLocalhost}, (ws, req) => {
    registerSource(fastify, ws);

    ws.on('close', code => {
      req.log.info({msg: 'Websocket closed', code});
    });
  });

  fastify.get('/sink', {websocket: true, preHandler: fastify.requestAuthorizer.authorizeSessionToken}, (ws, req) => {
    const expiration = fastify.requestAuthorizer.getSessionTokenExpiry(req.query.sessionToken);
    if (expiration === undefined) {
      ws.close();
      return;
    }

    registerSink(fastify, ws);

    // Close websocket when session expires
    const expirationTimeout = setTimeout(() => {
      fastify.log.info('Session token expired, closing socket.');
      ws.close(3000);
    }, expiration.getTime() - new Date().getTime());

    ws.on('close', code => {
      clearTimeout(expirationTimeout);
      req.log.info({msg: 'Websocket closed', code});
    });
  });
}
