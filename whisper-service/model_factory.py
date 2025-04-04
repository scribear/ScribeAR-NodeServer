from fastapi import WebSocket
from model_bases.whisper_model_base import WhisperModelBase


def modelFactory(modelKey: str, websocket: WebSocket) -> WhisperModelBase:
    '''
    Instantiates model with corresponding modelKey
    returns: A WhisperModel instance
    '''
    match modelKey:
        case 'mock-transcription-duration':
            from models.mock_transcription_duration import MockTranscribeDuration
            return MockTranscribeDuration(websocket)
        case 'faster-whisper:gpu-tiny-en':
            from models.faster_whisper import FasterWhisper
            return FasterWhisper(websocket, 'tiny.en', device='cuda', localAgreeDim=2, minNewSamples=FasterWhisper.SAMPLE_RATE)
        case 'faster-whisper:cpu-tiny-en':
            from models.faster_whisper import FasterWhisper
            return FasterWhisper(websocket, 'tiny.en', device='cpu', localAgreeDim=2, minNewSamples=FasterWhisper.SAMPLE_RATE * 3)
        case 'whisper-cpp:tiny-quantized':
            from models.whisper_cpp import WhisperCpp
            return WhisperCpp(websocket, modelPath='weights/tiny-quantized.bin', minNewSamples=WhisperCpp.SAMPLE_RATE * 5)
        case _:
            raise Exception('No model matching modelKey')
