from fastapi import WebSocket
from modelBases.whisperModelBase import WhisperModelBase


def modelFactory(modelKey: str, websocket: WebSocket) -> WhisperModelBase:
    '''
    Instantiates model with corresponding modelKey
    returns: A WhisperModel instance
    '''
    match modelKey:
        case 'mock':
            from models.mockWhisper import MockWhisper
            return MockWhisper(websocket)
        case 'cuda-fasterwhisper-tinyen':
            from models.fasterWhisper import FasterWhisper
            return FasterWhisper(websocket, 'tiny.en', device='cuda', localAgreeDim=2, minNewSamples=FasterWhisper.SAMPLE_RATE)
        case _:
            raise Exception('No model matching modelKey')
