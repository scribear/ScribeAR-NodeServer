from fastapi import WebSocket
from whisperModelBase import WhisperModelBase

def whisperModelFactory(modelKey: str, websocket: WebSocket) -> WhisperModelBase:
  '''
  Loads and creates model with given key
  returns: A WhisperModel instance
  '''
  match modelKey:
    case 'mock':
      from models.whisperMock import WhisperMock
      return WhisperMock(websocket)
    
    case _:
      raise Exception('No model matching modelKey')