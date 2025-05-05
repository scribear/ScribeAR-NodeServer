import {describe, expect} from 'vitest';
import {WebSocketServer, WebSocket} from 'ws';
import http from 'http';
import type {AddressInfo} from 'net';
import TranscriptionEngine, {BackendTranscriptBlockType, type BackendTranscriptBlock} from './transcription_engine.js';
import fakeLogger from '../../../test/fakes/fake_logger.js';
import type {ConfigType} from '@shared/config/config_schema.js';
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
  const apiKey = 'SOME_KEY';
  async function createTranscriptionEngine() {
    const {wss, address} = await createWebsocketServer();

    const websocketConnected = new Promise<WebSocket>(resolve => {
      wss.once('connection', socket => setImmediate(() => resolve(socket)));
    });

    const te = new TranscriptionEngine({whisper: {endpoint: address, apiKey}} as ConfigType, fakeLogger());

    return {wss, websocketConnected, te};
  }

  function cleanup(te: TranscriptionEngine, wss: WebSocketServer) {
    te.disconnectWhisperService();
    wss.close();
  }

  it('connects to whisper service', async () => {
    const {wss, websocketConnected, te} = await createTranscriptionEngine();

    te.connectWhisperService();
    await expect(websocketConnected).resolves.toBeTruthy();

    cleanup(te, wss);
  });

  it('disconnects existing connection if connect is called again', async () => {
    const {wss, websocketConnected, te} = await createTranscriptionEngine();

    te.connectWhisperService();
    const socket = await websocketConnected;
    const socketClose = new Promise(resolve => socket.on('close', () => resolve(true)));

    // Wait for transcription engine's socket to be in ready state
    await new Promise(r => setTimeout(r, 1000));

    te.connectWhisperService();
    await expect(socketClose).resolves.toBeTruthy();

    cleanup(te, wss);
  });

  it('sends apiKey after connecting to whisper service', async () => {
    const {wss, websocketConnected, te} = await createTranscriptionEngine();

    te.connectWhisperService();
    const socket = await websocketConnected;

    const receivedMessage = new Promise(resolve => {
      socket.once('message', data => resolve(JSON.parse(data.toString())));
    });

    await expect(receivedMessage).resolves.toEqual({api_key: apiKey});

    cleanup(te, wss);
  });

  it('forwards audio chunks to whisper service', async () => {
    const {wss, websocketConnected, te} = await createTranscriptionEngine();
    te.connectWhisperService();
    const socket = await websocketConnected;

    // Wait for transcription engine's socket to be in ready state
    await new Promise(r => setTimeout(r, 1000));

    const receivedChunks: Array<Buffer> = [];
    socket.on('message', data => receivedChunks.push(data as Buffer));

    const audioFileDir = path.join(__dirname, '../../../../test-audio-files/wikipedia-.fun/chunked');
    const chunkFiles = fs.readdirSync(audioFileDir);
    const chunks = [];
    for (const file of chunkFiles) {
      const chunk = fs.readFileSync(path.join(audioFileDir, file));
      chunks.push(chunk);
      te.forwardMessage(chunk, true);
    }

    await new Promise(r => setTimeout(r, 1000));

    expect(receivedChunks.length).toBe(chunks.length);
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].compare(receivedChunks[i])).toBe(0);
    }

    cleanup(te, wss);
  });

  it('forwards model selection message to whisper service', async () => {
    const {wss, websocketConnected, te} = await createTranscriptionEngine();
    te.connectWhisperService();
    const socket = await websocketConnected;

    // Wait for transcription engine's socket to be in ready state
    await new Promise(r => setTimeout(r, 1000));

    const receivedMessage = new Promise(resolve => {
      socket.once('message', data => resolve(JSON.parse(data.toString())));
    });

    const message = {model_key: 'selected_key', feature_selection: {}};
    te.forwardMessage(Buffer.from(JSON.stringify(message)), false);

    await new Promise(r => setTimeout(r, 1000));

    await expect(receivedMessage).resolves.toEqual(message);

    cleanup(te, wss);
  });

  it('emits transcription events when transcriptions are received', async () => {
    const {wss, websocketConnected, te} = await createTranscriptionEngine();
    te.connectWhisperService();
    const socket = await websocketConnected;

    const receivedBlocks: Array<BackendTranscriptBlock> = [];
    te.on('transcription', block => receivedBlocks.push(block));

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

    expect(receivedBlocks).toEqual(transcriptions);

    cleanup(te, wss);
  });

  it('emits sourceMessage but not transcription event when non transcription JSON message is received', async () => {
    const {wss, websocketConnected, te} = await createTranscriptionEngine();
    te.connectWhisperService();
    const socket = await websocketConnected;

    const receivedBlocks: Array<BackendTranscriptBlock> = [];
    const receivedMessages: Array<object> = [];
    te.on('transcription', block => receivedBlocks.push(block));
    te.on('sourceMessage', message => receivedMessages.push(message));

    const sentMessages: Array<object> = [
      {some: 'other', message: 'object'},
      {other: 'message', from: {whisper: ['service']}},
    ];
    for (const block of sentMessages) {
      socket.send(JSON.stringify(block));
    }

    await new Promise(r => setTimeout(r, 1000));

    expect(receivedBlocks).toEqual([]);
    expect(receivedMessages).toEqual(sentMessages);

    cleanup(te, wss);
  });
});
