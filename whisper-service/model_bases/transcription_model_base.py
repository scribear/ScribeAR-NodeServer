'''
Provides classes to define a unified transcription model interface.

Classes:
    BackendTranscriptionBlockType
    TranscriptionModelBase

Types:
    TranscriptionModelConfig
'''
import io
import logging
from abc import ABC, abstractmethod
from fastapi import WebSocket
from custom_types.config_types import ImplementationModelConfig
from custom_types.transcription_types import BackendTranscriptionBlockType, BackendTranscriptBlock


class TranscriptionModelBase(ABC):
    '''
    Base transcription model class.
    Presents a unified interface for using different transcription models on the backend.

    The validate_config(), load_model(), unload_model(), and 
    queue_audio_chunk() methods must be implemented.
    '''
    __slots__ = ['logger', 'ws', 'config']

    def __init__(self, ws: WebSocket, config: ImplementationModelConfig):
        '''
        Called when a websocket requests a transcription model.

        Parameters:
        ws                       (WebSocket): FastAPI websocket that requested the model
        config    (TranscriptionModelConfig): Custom JSON object containing configuration for model 
                                                Defined by implementation
        '''
        self.ws = ws
        self.config = self.validate_config(config)
        self.logger = logging.getLogger('uvicorn.error')

    @staticmethod
    @abstractmethod
    def validate_config(config: dict) -> ImplementationModelConfig:
        '''
        Should check if loaded JSON config is valid. Called model is instantiated.
        Throw an error if provided config is not valid
        Remember to call valididate_config for any model_bases to ensure configuration 
        for model_bases is checked as well. 
        e.g. if you use LocalAgreeModelBase: config = LocalAgreeModelBase.validate(config)

        Parameters:
        config (dict): Parsed JSON config from server device_config.json. Guaranteed to be a dict.

        Returns:
        config (TranscriptionModelConfig): Validated config object
        '''
        raise NotImplementedError('Must implement per model')

    @abstractmethod
    def load_model(self) -> None:
        '''
        Should load model into memory to be ready for transcription.
        Called when websocket connects.
        '''
        raise NotImplementedError('Must implement per model')

    @abstractmethod
    def unload_model(self) -> None:
        '''
        Should unload model from memory and cleanup.
        Called when websocket disconnects.
        '''
        raise NotImplementedError('Must implement per model')

    @abstractmethod
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

    async def on_final_transcript_block(self, text: str, start=-1.0, end=-1.0) -> None:
        '''
        Call this when a block of finalized transcription is ready

        Parameters:
        text    (str)  : Finalized transcribed text
        start   (float): Start time of this transcription chunk [Optional]
        end     (float): End time of this transcription chunk [Optional]
        '''
        self.logger.info('[%6.2f - %6.2f] Final      : %s', start, end, text)
        transcript_block: BackendTranscriptBlock = {
            'type': BackendTranscriptionBlockType.FINAL,
            'text': text,
            'start': start,
            'end': end
        }
        await self.ws.send_json(transcript_block)

    async def on_in_progress_transcript_block(self, text: str, start=-1.0, end=-1.0) -> None:
        '''
        Call this when a block of in progress transcription is ready.
        This is used to provide a lower latency transcription at the cost of some accuracy.
        If model does not support in progress guesses, only call on_final_transcript_chunk().

        Parameters:
        text    (str)  : Finalized transcribed text
        start   (float): Start time of this transcription block [Optional]
        end     (float): End time of this transcription block [Optional]
        '''
        self.logger.info('[%6.2f - %6.2f] In Progress: %s', start, end, text)
        transcript_block: BackendTranscriptBlock = {
            'type': BackendTranscriptionBlockType.IN_PROGRESS,
            'text': text,
            'start': start,
            'end': end
        }
        await self.ws.send_json(transcript_block)
