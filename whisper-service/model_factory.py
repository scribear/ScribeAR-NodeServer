'''
Function for instantiating specified model

Functions:
    model_factory

Classes:
    ModelKey
'''
# pylint: disable=import-outside-toplevel
from enum import StrEnum
from fastapi import WebSocket
from model_bases.transcription_model_base import TranscriptionModelBase


class ModelKey(StrEnum):
    '''
    Unique identifiers for supported whisper models
    '''
    MOCK_TRANSCRIPTION_DURATION = "mock-transcription-duration"
    FASTER_WHISPER_GPU_LARGE_V3 = "faster-whisper:gpu-large-v3"
    FASTER_WHISPER_CPU_TINY_EN = "faster-whisper:cpu-tiny-en"


def model_factory(model_key: ModelKey, websocket: WebSocket) -> TranscriptionModelBase:
    '''
    Instantiates model with corresponding ModelKey.

    Parameters:
    model_key   (ModelKey) : Unique identifier for model to instantiate
    websocket   (WebSocket): Websocket requesting model

    Returns:
    A TranscriptionModelBase instance
    '''
    match model_key:
        case ModelKey.MOCK_TRANSCRIPTION_DURATION:
            from models.mock_transcription_duration import MockTranscribeDuration
            return MockTranscribeDuration(websocket)
        case ModelKey.FASTER_WHISPER_GPU_LARGE_V3:
            from models.faster_whisper_model import FasterWhisperModel
            return FasterWhisperModel(
                websocket,
                'large-v3',
                device='cuda',
                local_agree_dim=2,
                min_new_samples=FasterWhisperModel.SAMPLE_RATE * 3
            )
        case ModelKey.FASTER_WHISPER_CPU_TINY_EN:
            from models.faster_whisper_model import FasterWhisperModel
            return FasterWhisperModel(
                websocket,
                'tiny.en',
                device='cpu',
                local_agree_dim=2,
                min_new_samples=FasterWhisperModel.SAMPLE_RATE * 3
            )
        case _:
            raise KeyError('No model matching model_key')
