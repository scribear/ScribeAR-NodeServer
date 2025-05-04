'''
Function for instantiating a specified model

Functions:
    model_factory
'''
from fastapi import WebSocket
from model_bases.transcription_model_base import TranscriptionModelBase
from model_implementations.import_model_implementation import import_model_implementation
from init_device_config import DeviceConfig


def model_factory(
    device_config: DeviceConfig,
    model_key: str,
    websocket: WebSocket
) -> TranscriptionModelBase:
    '''
    Instantiates model with corresponding model_key.

    Parameters:
    device_config (DeviceConfig): Device config object
    model_key     (str)         : Unique identifier for model to instantiate
    websocket     (WebSocket)   : Websocket requesting model

    Returns:
    A TranscriptionModelBase instance
    '''
    if model_key not in device_config:
        raise KeyError('No model matching model_key')

    implementation = import_model_implementation(
        device_config[model_key]['implementation_id']
    )

    return implementation(websocket, device_config[model_key]['implementation_configuration'])
