from fastapi import WebSocket
from modelBases.whisperModelBase import WhisperModelBase


def whisperModelFactory(modelKey: str, websocket: WebSocket) -> WhisperModelBase:
    '''
    Loads and creates model with given key
    returns: A WhisperModel instance
    '''
    match modelKey:
        case 'mock':
            from models.mockWhisper import MockWhisper
            return MockWhisper(websocket)
        case 'fasterwhispertiny':
            from models.fasterWhisper import FasterWhisper
            return FasterWhisper(websocket, 'tiny.en')
        case 'whispercpptiny':
            from models.whisperCpp import WhisperCpp
            return WhisperCpp(websocket, './weights/tiny-quantized.bin', minNewSamples=WhisperCpp.SAMPLE_RATE * 5)
        case _:
            raise Exception('No model matching modelKey')
