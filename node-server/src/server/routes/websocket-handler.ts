import type {BackendTranscriptBlock} from '@server/services/transcription-engine.js';
import type TranscriptionEngine from '@server/services/transcription-engine.js';
import {FastifyInstance} from 'fastify';
import WebSocket from 'ws';

/**
 * Register a websocket that listens for transcription events and forwards them
 * @param ws
 */
function registerSink(transcriptionEngine: TranscriptionEngine, ws: WebSocket) {
  const onTranscription = (block: BackendTranscriptBlock) => {
    try {
      ws.send(JSON.stringify(block));
    } catch {
      //
    }
  };

  transcriptionEngine.on('transcription', onTranscription);

  ws.on('close', () => {
    transcriptionEngine.removeListener('transcription', onTranscription);
  });
}

/**
 * Register a websocket that sends audio to be transcribed
 * Will throw error if a second websocket is registered before first has closed
 * @param ws
 */
function registerSource(transcriptionEngine: TranscriptionEngine, ws: WebSocket) {
  ws.on('message', data => {
    if (data instanceof Buffer) {
      try {
        transcriptionEngine.sendAudioChunk(data);
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
  fastify.get('/sourcesink', {websocket: true, preHandler: fastify.requestAuthorizer.authorize}, (ws, req) => {
    registerSink(fastify.transcriptionEngine, ws);
    registerSource(fastify.transcriptionEngine, ws);

    ws.on('close', code => {
      req.log.info({msg: 'Websocket closed', code});
    });
  });

  fastify.get('/sink', {websocket: true, preHandler: fastify.requestAuthorizer.authorize}, (ws, req) => {
    registerSink(fastify.transcriptionEngine, ws);

    ws.on('close', code => {
      req.log.info({msg: 'Websocket closed', code});
    });
  });

  fastify.get('/source', {websocket: true, preHandler: fastify.requestAuthorizer.authorize}, (ws, req) => {
    registerSource(fastify.transcriptionEngine, ws);

    ws.on('close', code => {
      req.log.info({msg: 'Websocket closed', code});
    });
  });
}
