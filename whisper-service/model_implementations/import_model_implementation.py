'''
Function for importing specified model implementation

Functions:
  import_model_implementation

Enums:
  ModelImplementationId
'''
# pylint: disable=import-outside-toplevel
from enum import StrEnum


class ModelImplementationId(StrEnum):
    '''
    Unique keys for all available implementations of TranscriptionModelBase
    '''
    MOCK_TRANSCRIPTION_DURATION = "mock_transcription_duration"
    FASTER_WHISPER = "faster_whisper"


def import_model_implementation(model_implementation_id: ModelImplementationId):
    '''
    Imports model with corresponding model_implementation_id.

    Parameters:
    model_implementation_id (str): Unique identifier for model to instantiate

    Returns:
    A TranscriptionModelBase class
    '''
    match(model_implementation_id):
        case ModelImplementationId.MOCK_TRANSCRIPTION_DURATION:
            from model_implementations.mock_transcription_duration import MockTranscribeDuration
            return MockTranscribeDuration
        case ModelImplementationId.FASTER_WHISPER:
            from model_implementations.faster_whisper_model import FasterWhisperModel
            return FasterWhisperModel
        case _:
            raise KeyError(
                f'No model implementation matching {model_implementation_id}'
            )
