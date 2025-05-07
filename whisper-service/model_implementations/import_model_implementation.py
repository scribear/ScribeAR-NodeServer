'''
Function for importing specified model implementation

Functions:
    import_model_implementation
'''
# pylint: disable=import-outside-toplevel
#   Disable linter rule so we can do imports in import_model_implementation
#   Avoids needing to import every model even if unused
#   Can potentially help with dealing with conflicting dependencies)
from model_bases.transcription_model_base import TranscriptionModelBase
from custom_types.config_types import ModelImplementationId


def import_model_implementation(
    model_implementation_id: ModelImplementationId
) -> TranscriptionModelBase:
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
