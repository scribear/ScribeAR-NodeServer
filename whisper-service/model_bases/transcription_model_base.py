'''
Provides classes to define a unified transcription model interface.

Classes:
    BackendTranscriptionBlockType
    TranscriptionModelBase
'''
import io
import logging
from enum import IntEnum
from fastapi import WebSocket


class BackendTranscriptionBlockType(IntEnum):
    '''
    Possible values for transcription block type value
    Should match values that node-server expects
    '''
    FINAL = 0
    IN_PROGRESS = 1


class TranscriptionModelBase:
    '''
    Base transcription model class.
    Presents a unified interface for using different transcription models on the backend.

    The load_model(), unload_model(), and queue_audio_chunk() methods must be implemented.
    '''
    __slots__ = ['logger', 'ws']

    def __init__(self, ws: WebSocket):
        '''
        Called when a websocket requests a transcription model.

        Parameters:
        ws  (WebSocket): FastAPI websocket that requested the model
        '''
        self.ws = ws
        self.logger = logging.getLogger('uvicorn.error')

    def load_model(self) -> None:
        '''
        Should load model into memory to be ready for transcription.
        Called when websocket connects.
        '''
        raise NotImplementedError('Must implement per model')

    def unload_model(self) -> None:
        '''
        Should unload model from memory and cleanup.
        Called when websocket disconnects.
        '''
        raise NotImplementedError('Must implement per model')

    async def queue_audio_chunk(self, audio_chunk: io.BytesIO) -> None:
        '''
        Called when an audio chunk is received.

        To implement this function, the audio_chunk should be used to produce transcriptions.
        This may require buffering the chunks until a larger segment is ready. Once a transcription 
        is ready, call on_final_transcript_block() or on_in_progress_transcript_block().

        Parameters:
        audio_chunk   (io.BytesIO): A buffer containing wav audio
        '''
        raise NotImplementedError('Must implement per model')

    async def on_final_transcript_block(self, text: str, start=-1, end=-1) -> None:
        '''
        Call this when a block of finalized transcription is ready

        Parameters:
        text    (str): Finalized transcribed text
        start   (int): Start time of this transcription chunk [Optional]
        end     (int): End time of this transcription chunk [Optional]
        '''
        self.logger.info('[%6.2f - %6.2f] Final      : %s', start, end, text)
        await self.ws.send_json({
            'type': BackendTranscriptionBlockType.FINAL,
            'text': text,
            'start': start,
            'end': end
        })

    async def on_in_progress_transcript_block(self, text: str, start=-1, end=-1) -> None:
        '''
        Call this when a block of in progress transcription is ready.
        This is used to provide a lower latency transcription at the cost of some accuracy.
        If model does not support in progress guesses, only call on_final_transcript_chunk().

        Parameters:
        text    (str): Finalized transcribed text
        start   (int): Start time of this transcription block [Optional]
        end     (int): End time of this transcription block [Optional]
        '''
        self.logger.info('[%6.2f - %6.2f] In Progress: %s', start, end, text)
        await self.ws.send_json({
            'type': BackendTranscriptionBlockType.IN_PROGRESS,
            'text': text,
            'start': start,
            'end': end
        })
