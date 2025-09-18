'''
Utility functions to help when implementing TranscriptionModelBase.validate_config()

Functions:
    config_dict_contains_int
    config_dict_contains_str
    config_dict_contains_dict
    config_dict_contains_list
    config_dict_contains_one_of
'''
import sys
from typing import Any


def config_dict_contains_int(config: dict, key: str, minimum=-sys.maxsize - 1, maximum=sys.maxsize):
    '''
    Checks if config contains a property, key, 
    that is an integer between minimum and maximum inclusive

    Parameters:
    config  (dict): Config dictionary
    key     (str) : Key to check in config dictionary
    minimum (int) : (Optional) minimum value key is allowed to be
    maximum (int) : (Optional) maximum value key is allowed to be
    '''
    if key not in config:
        raise ValueError(f'Config missing "{key}" property')
    if not isinstance(config[key], int):
        raise ValueError(f'"{key}" property of config must be an integer')
    if config[key] < minimum:
        raise ValueError(
            f'{key} property of config must be greater than or equal to {minimum}'
        )
    if config[key] > maximum:
        raise ValueError(
            f'{key} property of config must be less than or equal to {maximum}'
        )


def config_dict_contains_float(
    config: dict,
        key: str,
        minimum=-sys.maxsize - 1,
        maximum=sys.maxsize
):
    '''
    Checks if config contains a property, key, 
    that is a float between minimum and maximum inclusive

    Parameters:
    config  (dict) : Config dictionary
    key     (str)  : Key to check in config dictionary
    minimum (float): (Optional) minimum value key is allowed to be
    maximum (int)  : (Optional) maximum value key is allowed to be
    '''
    if key not in config:
        raise ValueError(f'Config missing "{key}" property')
    if not isinstance(config[key], float):
        raise ValueError(f'"{key}" property of config must be a float')
    if config[key] < minimum:
        raise ValueError(
            f'{key} property of config must be greater than or equal to {minimum}'
        )
    if config[key] > maximum:
        raise ValueError(
            f'{key} property of config must be less than or equal to {maximum}'
        )


def config_dict_contains_str(config: dict, key: str, min_length=0, max_length=sys.maxsize):
    '''
    Checks if config contains a property, key, 
    that is a string with length between min_length and max_length inclusive

    Parameters:
    config  (dict)  : Config dictionary
    key     (str)   : Key to check in config dictionary
    min_length (int): (Optional) minimum value key is allowed to be
    min_length (int): (Optional) maximum value key is allowed to be
    '''
    if key not in config:
        raise ValueError(f'Config missing "{key}" property')
    if not isinstance(config[key], str):
        raise ValueError(f'"{key}" property of config must be an string')
    if len(config[key]) < min_length:
        raise ValueError(
            f'{key} property of config must be string with length \
greater than or equal to {min_length}'
        )
    if len(config[key]) > max_length:
        raise ValueError(
            f'{key} property of config must be string with length \
less than or equal to {max_length}'
        )


def config_dict_contains_dict(config: dict, key: str):
    '''
    Checks if config contains a property, key, that is a dict

    Parameters:
    config  (dict): Config dictionary
    key     (str) : Key to check in config dictionary
    '''
    if key not in config:
        raise ValueError(f'Config missing "{key}" property')
    if not isinstance(config[key], dict):
        raise ValueError(f'"{key}" property of config must be an object')


def config_dict_contains_list(config: dict, key: Any):
    '''
    Checks if config contains a property, key, that is a list

    Parameters:
    config  (dict): Config dictionary
    key     (str) : Key to check in config dictionary
    '''
    if key not in config:
        raise ValueError(f'Config missing "{key}" property')
    if not isinstance(config[key], list):
        raise ValueError(f'"{key}" property of config must be an array')


def config_dict_contains_one_of(config: dict, key: Any, options: list[Any]):
    '''
    Checks if config contains a property, key, that one of the options provided

    Parameters:
    config  (dict): Config dictionary
    key     (Any) : Key to check in config dictionary
    options (list): List of possible options property can have
    '''
    if key not in config:
        raise ValueError(f'Config missing "{key}" property')
    if config[key] not in options:
        raise ValueError(
            f'"{key}" property of config must be one of: {options}')
