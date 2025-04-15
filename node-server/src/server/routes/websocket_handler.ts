import type {BackendTranscriptBlock} from '@server/services/transcription_engine.js';
import {FastifyInstance, type FastifyRequest} from 'fastify';
import WebSocket from 'ws';

/**
 * Register a websocket that listens for transcription events and forwards them
 * Closes websocket when session becomes invalid
 * @param fastify fastify webserver instance
 * @param req fastify request that initiated websocket connection
 * @param ws websocket to register
 */
function registerSink(
  fastify: FastifyInstance,
  req: FastifyRequest<{Querystring: {sessionToken?: string}}>,
  ws: WebSocket,
) {
  const onTranscription = (block: BackendTranscriptBlock) => {
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1';
    if (!isLocalhost && !fastify.requestAuthorizer.sessionTokenIsValid(req.query.sessionToken)) {
      ws.close();
      return;
    }

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
 * Closes websocket when session becomes invalid
 * @param fastify fastify webserver instance
 * @param req fastify request that initiated websocket connection
 * @param ws websocket to register
 */
function registerSource(
  fastify: FastifyInstance,
  req: FastifyRequest<{Querystring: {sessionToken?: string}}>,
  ws: WebSocket,
) {
  const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1';
  ws.on('message', data => {
    if (!isLocalhost && !fastify.requestAuthorizer.sessionTokenIsValid(req.query.sessionToken)) {
      ws.close();
      return;
    }
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
    registerSink(fastify, req, ws);
    registerSource(fastify, req, ws);

    ws.on('close', code => {
      req.log.info({msg: 'Websocket closed', code});
    });

    ws.on('error', err => {
      req.log.error({msg: 'WebSocket error', err});
    });
  });

  fastify.get('/source', {websocket: true, preHandler: fastify.requestAuthorizer.authorizeLocalhost}, (ws, req) => {
    registerSource(fastify, req, ws);

    ws.on('close', code => {
      req.log.info({msg: 'Websocket closed', code});
    });
  });

  fastify.get('/sink', {websocket: true, preHandler: fastify.requestAuthorizer.authorizeSessionToken}, (ws, req) => {
    registerSink(fastify, req, ws);

    ws.on('close', code => {
      req.log.info({msg: 'Websocket closed', code});
    });
  });
}
