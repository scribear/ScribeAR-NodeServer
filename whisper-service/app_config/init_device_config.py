'''
Function to load then initialize whisper service according to device config

Functions:
    init_device_config

Types:
    AvailableFeaturesConfig
    ModelConfig
    DeviceConfig
'''
import json
import logging
from typing import Any
from model_implementations.import_model_implementation import \
    ModelImplementationId, import_model_implementation
from utils.config_dict_contains import \
    config_dict_contains_dict, config_dict_contains_one_of, config_dict_contains_str
from custom_types.config_types import ModelConfig, DeviceConfig
from custom_types.model_selection_types import SelectionOptions


def init_model(device_config: dict[str, Any], key: str) -> ModelConfig:
    '''
    Validates and initalizes given model_key in device_config.
    Checks if all required property for ModelConfig are present. Throws error if not.
    Implementation configuration is checked automatically when implementation is initialized.
    Models are initialized by calling load_model() then unload_mode().

    Parameters:
    device_config (dict): Loaded device_config dict
    key           (str) : model_key to initialize

    Return:
    Validated ModelConfig object
    '''
    logger = logging.getLogger('uvicorn.error')

    # Grab config specific to model
    config_dict_contains_dict(device_config, key)
    model_config = device_config[key]

    # Check required properties
    config_dict_contains_str(model_config, 'display_name', min_length=1)
    config_dict_contains_str(model_config, 'description', min_length=1)
    config_dict_contains_one_of(
        model_config, 'implementation_id', list(ModelImplementationId))
    config_dict_contains_dict(model_config, 'implementation_configuration')
    config_dict_contains_dict(model_config, 'available_features')

    # Initialize the configured model
    implementation_id: ModelImplementationId = model_config['implementation_id']
    implementation_config = model_config['implementation_configuration']
    logger.info(
        'Initializing implementation: %s for model_key: %s', implementation_id, key
    )

    implementation = import_model_implementation(implementation_id)
    model = implementation({}, implementation_config)

    model.load_model()
    model.unload_model()
    logger.info(
        'Successfully initialized implementation: %s for model_key: %s', implementation_id, key
    )

    return {
        'display_name': model_config['display_name'],
        'description': model_config['description'],
        'implementation_id': implementation_id,
        'implementation_configuration': implementation_config,
        'available_features': model_config['available_features']
    }


def init_device_config(device_config_path: str) -> tuple[DeviceConfig, SelectionOptions]:
    '''
    Loads device config file from provided path then initializes configured models.


    Parameters:
    device_config_path (str): Path to device config file

    Returns:
    DeviceConfig object and SelectionOptions object
    '''
    logger = logging.getLogger('uvicorn.error')

    logger.info('Loading device config from: %s', device_config_path)
    with open(device_config_path, 'r', encoding='utf-8') as file:
        loaded_config = json.load(file)

    if not isinstance(loaded_config, dict):
        raise ValueError('Device config must an object')

    device_config: DeviceConfig = {}
    selection_options: SelectionOptions = []
    for key in loaded_config.keys():
        model_config = init_model(loaded_config, key)

        device_config[key] = model_config

        selection_options.append({
            'model_key': key,
            'display_name': model_config['display_name'],
            'description': model_config['description'],
            'available_features': model_config['available_features']
        })

    return device_config, selection_options
