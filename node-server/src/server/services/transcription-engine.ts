import type {ConfigType} from '@shared/config/config-schema.js';
import type {Logger} from '@shared/logger/logger.js';
import {TypedEmitter} from 'tiny-typed-emitter';
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
  transcription: (block: BackendTranscriptBlock) => unknown;
};

export default class TranscriptionEngine extends TypedEmitter<AudioTranscriptEvents> {
  private _ws?: WebSocket;
  private _reconnectInterval: number;

  constructor(
    private _config: ConfigType,
    private _log: Logger,
  ) {
    super();
    this._reconnectInterval = this._config.whisper.reconnectInterval;
    this._connectWhisperService();
  }

  /**
   * Connects to whisper service via websocket connection
   */
  private _connectWhisperService() {
    this._ws = new WebSocket(this._config.whisper.endpoint);

    this._ws.on('error', err => {
      this._log.error({msg: 'Error on whisper service connection', err});
    });

    // Reconnect to whisper service automatically after an exponentially increasing timeout
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
      // TODO: Better parsing and error handling
      const {final, inprogress} = JSON.parse(data.toString());

      if (final) {
        const block: BackendTranscriptBlock = {
          text: final.text,
          start: final.start,
          end: final.end,
          type: BackendTranscriptBlockType.Final,
        };

        this.emit('transcription', block);
      }
      if (inprogress) {
        const block: BackendTranscriptBlock = {
          text: inprogress.text,
          start: inprogress.start,
          end: inprogress.end,
          type: BackendTranscriptBlockType.InProgress,
        };

        this.emit('transcription', block);
      }
    });
  }

  /**
   * Send an audio chunk to the backend
   * Should be a buffer with 16k stereo float32 PCM audio
   * @param chunk
   */
  sendAudioChunk(chunk: Buffer) {
    this._ws?.send(chunk);
  }
}
