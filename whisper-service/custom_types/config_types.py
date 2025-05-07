'''
Type definitions for objects used to configure whisper service

Enums:
  ModelImplementationId

Types:
  JsonType
  ImplementationModelConfig
  AppConfig
  AvailableFeaturesConfig
  ModelConfig
  DeviceConfig
'''
from enum import StrEnum
from typing import TypedDict, Union, List, Dict


class AppConfig(TypedDict):
    '''
    Object to hold application config loaded from .env file
    '''
    API_KEY: str
    LOG_LEVEL: str
    PORT: int
    HOST: str


class AvailableFeaturesConfig(TypedDict):
    '''
    Type hint for available features configuration dict
    Nested within ModelConfig
    '''


class ModelImplementationId(StrEnum):
    '''
    Unique keys for all available implementations of TranscriptionModelBase
    Device config should only select ids from this enum
    '''
    MOCK_TRANSCRIPTION_DURATION = "mock_transcription_duration"
    FASTER_WHISPER = "faster_whisper"


type JsonType = Union[None, int, str, bool,
                      List[JsonType], Dict[str, JsonType]]

# Type hint for object used for configuring model implementations
# Used by model implementations and nested in ModelConfig
type ImplementationModelConfig = Dict[str, JsonType]


class ModelConfig(TypedDict):
    '''
    Type hint for model configuration dict
    Nested within DeviceConfig
    '''
    display_name: str
    description: str
    implementation_id: ModelImplementationId
    implementation_configuration: ImplementationModelConfig
    available_features: AvailableFeaturesConfig


# Type hint for loaded device configuration dict
type DeviceConfig = dict[str, ModelConfig]
