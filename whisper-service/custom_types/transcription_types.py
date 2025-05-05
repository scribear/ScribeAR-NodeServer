'''
Type definitions for transcription messages

Enums:
    BackendTranscriptionBlockType
    BackendTranscriptBlockType
'''
from enum import IntEnum
from typing import TypedDict


class BackendTranscriptionBlockType(IntEnum):
    '''
    Possible values for transcription block type value
    Enum literal values must match values in node server/frontend
    '''
    FINAL = 0
    IN_PROGRESS = 1


class BackendTranscriptBlock(TypedDict):
    '''
    Type hint for transcription block messages passed to node server/frontend
    '''
    type: BackendTranscriptionBlockType
    text: str
    start: float
    end: float
