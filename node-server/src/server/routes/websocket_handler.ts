import AuthenticationService, {Identities} from '@server/services/authentication_service.js';
import type {BackendTranscriptBlock} from '@server/services/transcription_engine.js';
import type {Logger} from '@shared/logger/logger.js';
import {FastifyInstance, type FastifyBaseLogger} from 'fastify';
import WebSocket from 'ws';

/**
 * Helper function for determining authorization for a websocket
 * @param ws websocket to register
 * @param authenticationService authenticationService instance
 * @param allowedIdentities array of identities that should be accepted
 * @param log logger
 * @returns true if authorized, false otherwise
 */
async function authorizeWebsocket(
  ws: WebSocket,
  authenticationService: AuthenticationService,
  allowedIdentities: Array<Identities>,
  log: FastifyBaseLogger,
): Promise<boolean> {
  const jsonMessage = new Promise(resolve => {
    ws.once('message', data => {
      try {
        resolve(JSON.parse(data.toString()));
      } catch (err) {
        log.error({msg: 'Invalid authorization message received from client', err});
      }
    });
  });

  const timeout = new Promise<false>(resolve => setTimeout(() => resolve(false), 5_000));

  const result = await Promise.any([jsonMessage, timeout]);
  if (result === false) {
    log.info({msg: 'Authorization timed out'});
    return false;
  }
  log.debug({msg: 'Received authorization message from client', message: result});

  if (typeof result !== 'object' || result === null) {
    log.error({msg: 'Invalid authorization message received from client: Not an object'});
    return false;
  }

  const sourceToken = (result as {sourceToken: string})['sourceToken'];
  const sessionToken = (result as {sessionToken: string})['sessionToken'];
  const {authorized} = authenticationService.authorizeTokens(
    undefined,
    sessionToken,
    sourceToken,
    allowedIdentities,
    log as Logger,
  );
  return authorized;
}

/**
 * Register a websocket that listens for transcription events and forwards them
 * Closes websocket when session becomes invalid
 * @param fastify fastify webserver instance
 * @param ws websocket to register
 * @param log logger
 */
function registerSink(fastify: FastifyInstance, ws: WebSocket, log: FastifyBaseLogger) {
  log.debug('Registering websocket as sink');
  const onTranscription = (block: BackendTranscriptBlock) => {
    try {
      log.trace({msg: 'Forwarding transcription block to client', block});
      ws.send(JSON.stringify(block));
    } catch (err) {
      log.error({msg: 'Error sending transcription to sink', err});
    }
  };

  fastify.transcriptionEngine.on('transcription', onTranscription);

  ws.on('close', () => {
    log.trace('Websocket closed, removing transcription event listener');
    fastify.transcriptionEngine.removeListener('transcription', onTranscription);
  });
}

/**
 * Register a websocket that sends audio to be transcribed
 * Will throw error if a second websocket is registered before first has closed
 * @param fastify fastify webserver instance
 * @param ws websocket to register
 * @param log logger
 */
function registerSource(fastify: FastifyInstance, ws: WebSocket, log: FastifyBaseLogger) {
  fastify.transcriptionEngine.connectWhisperService();

  log.debug('Registering websocket as source');
  const onSourceMessage = (data: JSON) => {
    try {
      log.trace({msg: 'Forwarding source message to client', data});
      ws.send(JSON.stringify(data));
    } catch (err) {
      log.error({msg: 'Error sending source message to source', err});
    }
  };

  ws.on('message', (data, isBinary) => {
    log.trace({msg: 'Forwarding message for transcription', data});
    fastify.transcriptionEngine.forwardMessage(data, isBinary);
  });

  fastify.transcriptionEngine.on('sourceMessage', onSourceMessage);
  ws.on('close', () => {
    log.trace('Websocket closed, removing sourceMessage event listener');
    fastify.transcriptionEngine.removeListener('sourceMessage', onSourceMessage);
    fastify.transcriptionEngine.disconnectWhisperService();
  });
}

/**
 * Registers websocket endpoints for transcription source and sinks with fastify webserver
 * @param fastify
 */
export default function websocketHandler(fastify: FastifyInstance) {
  fastify.get('/sourcesink', {websocket: true}, async (ws, req) => {
    if (!(await authorizeWebsocket(ws, fastify.authenticationService, [Identities.SourceToken], fastify.log))) {
      return ws.close();
    }

    registerSink(fastify, ws, req.log);
    registerSource(fastify, ws, req.log);

    ws.on('close', code => {
      req.log.info({msg: 'Websocket closed', code});
    });
  });

  fastify.get('/source', {websocket: true}, async (ws, req) => {
    if (!(await authorizeWebsocket(ws, fastify.authenticationService, [Identities.SourceToken], fastify.log))) {
      return ws.close();
    }

    registerSource(fastify, ws, req.log);

    ws.on('close', code => {
      req.log.info({msg: 'Websocket closed', code});
    });
  });

  fastify.get('/sink', {websocket: true}, async (ws, req) => {
    if (
      !(await authorizeWebsocket(
        ws,
        fastify.authenticationService,
        [Identities.SourceToken, Identities.SessionToken],
        fastify.log,
      ))
    ) {
      return ws.close();
    }

    registerSink(fastify, ws, req.log);

    // Close websocket when session expires
    let expirationTimeout: NodeJS.Timeout | undefined;
    if (req.authorizationExpiryTimeout) {
      fastify.log.debug({msg: 'Setting session expiration timeout', timeout: req.authorizationExpiryTimeout});
      expirationTimeout = setTimeout(() => {
        fastify.log.info('Session token expired, closing socket.');
        ws.close(3000);
      }, req.authorizationExpiryTimeout);
    }

    ws.on('close', code => {
      clearTimeout(expirationTimeout);
      req.log.info({msg: 'Websocket closed', code});
    });
  });
}
