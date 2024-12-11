import type {ConfigType} from '@shared/config/config-schema.js';
import type {Logger} from '@shared/logger/logger.js';
import EventEmitter from 'events';
import type {TypedEmitter} from 'tiny-typed-emitter';
import WebSocket from 'ws';

export enum BackendTranscriptBlockType {
  Final = 0,
  InProgress = 1,
}

export type BackendTranscriptBlock = {
  type: BackendTranscriptBlockType;
  start: number;
  end: number;
  text: string;
};

export type AudioTranscriptEvents = {
  audioChunk: (chunk: Buffer) => unknown;
  transcription: (block: BackendTranscriptBlock) => unknown;
};

export default class TranscriptionEngine {
  private _events = new EventEmitter() as TypedEmitter<AudioTranscriptEvents>;
  get events() {
    return this._events;
  }

  private _ws?: WebSocket;
  private _reconnectInterval: number;

  constructor(
    private _config: ConfigType,
    private _log: Logger,
  ) {
    this._reconnectInterval = this._config.whisper.reconnectInterval;
    this._connectWhisperService();

    this._events.on('audioChunk', chunk => {
      this._ws?.send(chunk);
    });
  }

  private _connectWhisperService() {
    this._ws = new WebSocket(this._config.whisper.endpoint);

    this._ws.on('error', err => {
      this._log.error({msg: 'Error on whisper service connection', err});
    });

    this._ws.on('close', () => {
      this._log.info(`Whisper service connection closed, reconnecting in ${this._reconnectInterval}ms`);
      setTimeout(() => this._connectWhisperService(), this._reconnectInterval);
      this._config.whisper.reconnectInterval = Math.min(30_000, 2 * this._reconnectInterval);
    });

    this._ws.on('open', () => {
      this._log.info('Connected to whisper service');
      this._reconnectInterval = this._config.whisper.reconnectInterval;
    });

    this._ws.on('message', data => {
      const {final, inprogress} = JSON.parse(data.toString());

      if (final) {
        const block: BackendTranscriptBlock = {
          text: final.text,
          start: final.start,
          end: final.end,
          type: BackendTranscriptBlockType.Final,
        };

        this._events.emit('transcription', block);
      }
      if (inprogress) {
        const block: BackendTranscriptBlock = {
          text: inprogress.text,
          start: inprogress.start,
          end: inprogress.end,
          type: BackendTranscriptBlockType.InProgress,
        };

        this._events.emit('transcription', block);
      }
    });
  }

  registerSink(ws: WebSocket) {
    const onTranscription = (block: BackendTranscriptBlock) => {
      ws.send(JSON.stringify(block));
    };

    this._events.on('transcription', onTranscription);

    ws.on('close', () => {
      this._events.removeListener('transcription', onTranscription);
    });
  }

  registerSource(ws: WebSocket) {
    ws.on('message', data => {
      if (data instanceof Buffer) {
        this._events.emit('audioChunk', data);
      }
    });
  }
}
