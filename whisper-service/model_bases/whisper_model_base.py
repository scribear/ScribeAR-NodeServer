import io
from fastapi import WebSocket
from enum import IntEnum
import logging


class BackendTranscriptionBlockType(IntEnum):
    Final = 0
    InProgress = 1


class WhisperModelBase:
    '''
    Base whisper model class
    Presents a unified interface for using different whisper models on the backend

    The loadModel(), unloadModel(), and queueAudioChunk() methods need to be implemented.
    '''
    __slots__ = ['logger', 'ws']

    def __init__(self, ws: WebSocket):
        self.ws = ws
        self.logger = logging.getLogger('uvicorn.error')

    def loadModel(self) -> None:
        '''
        Load model into memory
        Called when websocket connects
        '''
        raise Exception('Must implement per model')

    def unloadModel(self) -> None:
        '''
        Unload model from memory
        Called when websocket disconnects
        '''
        raise Exception('Must implement per model')

    async def queueAudioChunk(self, chunk: io.BytesIO) -> None:
        '''
        Called when an audio chunk is received
        Chunk will be a buffer containing wav audio
        '''
        raise Exception('Must implement per model')

    async def onFinalTranscript(self, text: str, start=-1, end=-1):
        '''
        Call this when a section of finalized transcription is ready
        Start and end times are optional
        '''
        self.logger.info(f'[{start:6.2f} - {end:6.2f}] Final      : {text}')
        await self.ws.send_json({
            'type': BackendTranscriptionBlockType.Final,
            'text': text,
            'start': start,
            'end': end
        })

    async def onInProgressTranscript(self, text: str, start=-1, end=-1):
        '''
        Call this when a section of in progress transcription is ready
        If model does not support in progress guesses, only call onFinalTranscript
        Start and end times are optional
        '''
        self.logger.info(f'[{start:6.2f} - {end:6.2f}] In Progress: {text}')
        await self.ws.send_json({
            'type': BackendTranscriptionBlockType.InProgress,
            'text': text,
            'start': start,
            'end': end
        })
