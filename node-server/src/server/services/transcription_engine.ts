import type {ConfigType} from '@shared/config/config_schema.js';
import type {Logger} from '@shared/logger/logger.js';
import {Type, type Static} from '@sinclair/typebox';
import {Value} from '@sinclair/typebox/value';
import {TypedEmitter} from 'tiny-typed-emitter';
import WebSocket from 'ws';

export enum BackendTranscriptBlockType {
  Final = 0,
  InProgress = 1,
}

const BACKEND_TRANSCRIPT_BLOCK_SCHEMA = Type.Object(
  {
    type: Type.Enum(BackendTranscriptBlockType),
    start: Type.Number(),
    end: Type.Number(),
    text: Type.String(),
  },
  {additionalProperties: false},
);

export type BackendTranscriptBlock = Static<typeof BACKEND_TRANSCRIPT_BLOCK_SCHEMA>;

export type AudioTranscriptEvents = {
  transcription: (block: BackendTranscriptBlock) => unknown;
  sourceMessage: (message: JSON) => unknown;
};

export default class TranscriptionEngine extends TypedEmitter<AudioTranscriptEvents> {
  private _ws?: WebSocket;
  private _log: Logger;

  constructor(
    private _config: ConfigType,
    log: Logger,
  ) {
    super();
    this._log = log.child({service: 'TranscriptionEngine'});
  }

  /**
   * Initializes a new connection to whisper service
   */
  connectWhisperService() {
    if (this._ws) {
      this._log.debug('Closing existing websocket before initializing new connection');

      try {
        this._ws.close();
      } catch (err) {
        this._log.warn({msg: 'Failed to close existing websocket before initializing new connection', err});
      }
    }

    const ws = new WebSocket(this._config.whisper.endpoint);
    ws.once('open', () => {
      this._log.info('Connected to whisper service');
      ws.send(
        JSON.stringify({
          api_key: this._config.whisper.apiKey,
        }),
      );

      this._ws = ws;
      ws.on('message', data => {
        let message;
        try {
          message = JSON.parse(data.toString());
        } catch (err) {
          this._log.error({msg: 'Failed to parse message from whisper service', err, message: data.toString()});
          return;
        }
        const isTranscriptBlock = Value.Check(BACKEND_TRANSCRIPT_BLOCK_SCHEMA, message);

        if (isTranscriptBlock) {
          this._log.trace({msg: 'Emiting transcript transcript event', block: message});
          this.emit('transcription', message);
        } else {
          this._log.trace({msg: 'Emiting source message event', message});
          this.emit('sourceMessage', message);
        }
      });
    });

    ws.on('error', err => {
      this._log.error({msg: 'Whisper service websocket encountered an error', err});
    });

    ws.on('close', code => {
      this._log.info(`Whisper service connection closed with code ${code}`);
    });
  }

  /**
   * Disconnects the existing whisper service connection
   */
  disconnectWhisperService() {
    if (this._ws) {
      this._log.debug('Closing existing websocket');

      try {
        this._ws.close();
      } catch (err) {
        this._log.warn({msg: 'Failed to close existing websocket', err});
      }
    } else {
      this._log.trace('No existing websocket to disconnect');
    }
  }

  /**
   * Forward a message to whisper service
   * @param message message to send
   * @param isBinary if message is binary or not
   */
  forwardMessage(data: WebSocket.RawData, isBinary: boolean) {
    if (this._ws) {
      const message = isBinary ? data : data.toString();
      try {
        this._log.trace({msg: 'Forwarding message to whisper server', message});
        this._ws.send(message);
      } catch (err) {
        this._log.error({msg: 'Error while forwarding message to whisper server', data, err});
      }
    } else {
      this._log.debug({msg: "Can't forward message to whisper service because websocket doesn't exist", data});
    }
  }
}
