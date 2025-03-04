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
        case 'fasterwhispertinyen':
            from models.fasterWhisper import FasterWhisper
            return FasterWhisper(websocket, 'tiny.en', localAgreeDim=2, minNewSamples=FasterWhisper.SAMPLE_RATE)
        case 'rpi5-whispercpp-tiny-quantized':
            from models.whisperCpp import WhisperCpp
            return WhisperCpp(websocket, './weights/tiny-quantized.bin', minNewSamples=WhisperCpp.SAMPLE_RATE * 5)
        case _:
            raise Exception('No model matching modelKey')
