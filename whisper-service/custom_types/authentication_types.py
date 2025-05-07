'''
Type definitions for authentication messages

Types:
    WhisperAuthMessage
'''
from typing import TypedDict


class WhisperAuthMessage(TypedDict):
    '''
    Type hint for message send by frontnend to authenticate websocket
    '''
    api_key: str
