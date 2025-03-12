from fastapi import WebSocket
from model_bases.whisper_model_base import WhisperModelBase


def modelFactory(modelKey: str, websocket: WebSocket) -> WhisperModelBase:
    '''
    Instantiates model with corresponding modelKey
    returns: A WhisperModel instance
    '''
    match modelKey:
        case 'mock':
            from models.mock_whisper import MockWhisper
            return MockWhisper(websocket)
        case 'cuda-fasterwhisper-tinyen':
            from models.faster_whisper import FasterWhisper
            return FasterWhisper(websocket, 'tiny.en', device='cuda', localAgreeDim=2, minNewSamples=FasterWhisper.SAMPLE_RATE * 2)
        case 'cpu-fasterwhisper-tinyen':
            from models.faster_whisper import FasterWhisper
            return FasterWhisper(websocket, 'tiny.en', device='cpu', localAgreeDim=2, minNewSamples=FasterWhisper.SAMPLE_RATE * 2)
        case _:
            raise Exception('No model matching modelKey')
