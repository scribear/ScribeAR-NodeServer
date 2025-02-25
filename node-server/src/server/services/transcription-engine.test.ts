import {describe, expect} from 'vitest';
import {WebSocketServer, WebSocket} from 'ws';
import http from 'http';
import type {AddressInfo} from 'net';
import TranscriptionEngine, {BackendTranscriptBlockType, type BackendTranscriptBlock} from './transcription-engine.js';
import fakeLogger from '@test/fakes/fake-logger.js';
import type {ConfigType} from '@shared/config/config-schema.js';
import fs from 'fs';
import path from 'path';

function createWebsocketServer(): Promise<{wss: WebSocketServer; address: string}> {
  return new Promise(resolve => {
    const server = http.createServer();
    const wss = new WebSocketServer({server});

    server.listen(0, '127.0.0.1', () => {
      const {port} = server.address() as AddressInfo;
      resolve({wss, address: `ws://127.0.0.1:${port}`});
    });
  });
}

describe('Transcription engine', it => {
  async function connectEngine() {
    const {wss, address} = await createWebsocketServer();

    const websocketConnected = new Promise<WebSocket>(resolve => {
      wss.once('connection', socket => setTimeout(() => resolve(socket), 1000));
    });

    const te = new TranscriptionEngine(
      {
        whisper: {
          endpoint: address,
          reconnectInterval: 1_000,
        },
      } as ConfigType,
      fakeLogger(),
    );

    return {wss, websocketConnected, te};
  }

  function cleanup(te: TranscriptionEngine, wss: WebSocketServer) {
    te.destroy();
    wss.close();
  }

  it('connects to whisper service', async () => {
    const {wss, websocketConnected, te} = await connectEngine();

    await expect(websocketConnected).resolves.toBeTruthy();

    cleanup(te, wss);
  });

  it('reconnects to whisper service on disconnect', async () => {
    const {wss, websocketConnected, te} = await connectEngine();

    const socket = await websocketConnected;
    socket.close();

    const websocketReconnected = new Promise<WebSocket>(resolve => {
      wss.once('connection', socket => setTimeout(() => resolve(socket), 1000));
    });

    await expect(websocketReconnected).resolves.toBeTruthy();

    cleanup(te, wss);
  });

  it('sends audio chunks to whisper service', async () => {
    const {wss, websocketConnected, te} = await connectEngine();
    const socket = await websocketConnected;

    const receivedChunks: Array<Buffer> = [];
    socket.on('message', data => {
      receivedChunks.push(data as Buffer);
    });

    const audioFileDir = path.join(__dirname, '../../../test/audio-files/wikipedia-.fun/chunked');
    const chunkFiles = fs.readdirSync(audioFileDir);
    const chunks = [];
    for (const file of chunkFiles) {
      const chunk = fs.readFileSync(path.join(audioFileDir, file));
      chunks.push(chunk);
      te.sendAudioChunk(chunk);
    }

    await new Promise(r => setTimeout(r, 1000));

    expect(chunks.length).toEqual(receivedChunks.length);
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].compare(receivedChunks[i])).toBe(0);
    }

    cleanup(te, wss);
  });

  it('recieves transcription events', async () => {
    const {wss, websocketConnected, te} = await connectEngine();
    const socket = await websocketConnected;

    const recievedBlocks: Array<BackendTranscriptBlock> = [];
    te.on('transcription', block => {
      recievedBlocks.push(block);
    });

    const transcriptions: Array<BackendTranscriptBlock> = [
      {type: BackendTranscriptBlockType.InProgress, text: 'Hello', start: 0, end: 1},
      {type: BackendTranscriptBlockType.InProgress, text: 'this is some', start: 1, end: 2},
      {type: BackendTranscriptBlockType.Final, text: 'Hello, this is some', start: 0, end: 2},
      {type: BackendTranscriptBlockType.InProgress, text: 'test transcription', start: 2, end: 3},
      {type: BackendTranscriptBlockType.Final, text: 'test transcriptions.', start: 2, end: 3},
    ];
    for (const block of transcriptions) {
      socket.send(JSON.stringify(block));
    }

    await new Promise(r => setTimeout(r, 1000));

    expect(recievedBlocks).toEqual(transcriptions);

    cleanup(te, wss);
  });
});
