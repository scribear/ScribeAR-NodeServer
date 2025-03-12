import type {ConfigType} from '@shared/config/config_schema.js';
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
      this._reconnectInterval = Math.min(30_000, 2 * this._reconnectInterval);
    });

    this._ws.on('open', () => {
      this._log.info('Connected to whisper service');
      this._reconnectInterval = this._config.whisper.reconnectInterval;
    });

    this._ws.on('message', data => {
      // TODO: Check data format?
      const block = JSON.parse(data.toString());
      this.emit('transcription', block);
    });
  }

  /**
   * Send an audio chunk to the backend
   * Each chunk should be buffer containing wav audio
   * @param chunk
   */
  sendAudioChunk(chunk: Buffer) {
    try {
      this._ws?.send(chunk);
    } catch (err) {
      this._log.trace({msg: 'Error while sending audio chunk to whisper server', err});
    }
  }

  /**
   * Closes connection to whisper serverice permanently
   */
  destroy() {
    this._log.info('Destroying transcription engine');
    this._ws?.removeAllListeners('close');
    this._ws?.close();
    this.removeAllListeners();
  }
}
