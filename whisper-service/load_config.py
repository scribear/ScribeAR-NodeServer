'''
Helper function to load application configuration

Functions:
    load_config

Classes:
    AppConfig
'''
import os
from dataclasses import dataclass
from dotenv import load_dotenv

# pylint: disable=invalid-name
@dataclass
class AppConfig:
    '''
    Object to hold application config loaded from .env file
    '''
    API_KEY: str = ''
    LOG_LEVEL: str = ''
    PORT: int = 0
    HOST: str = ''


def load_config() -> AppConfig:
    '''
    Loads application config from .env file.

    Returns:
    AppConfig object
    '''
    load_dotenv()

    config = AppConfig()
    config.API_KEY = os.environ.get('API_KEY', '')
    config.LOG_LEVEL = os.environ.get('LOG_LEVEL', 'info')
    config.PORT = int(os.environ.get('PORT', 8000))
    config.HOST = os.environ.get('HOST', '127.0.0.1')

    return config
