from fastapi import WebSocket
from whisperModelBase import WhisperModelBase

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
      return FasterWhisper(websocket, 'tiny.en', modelRunBufferDiffThresh=3, localAgreeDim=2, maxBufferLength=10)
    case _:
      raise Exception('No model matching modelKey')