'''
Helper function to load application configuration

Functions:
    load_config

Classes:
    AppConfig
'''
import os
from dotenv import load_dotenv
from custom_types.config_types import AppConfig


def load_config() -> AppConfig:
    '''
    Loads application config from .env file.

    Returns:
    AppConfig object
    '''
    load_dotenv()

    config = AppConfig()
    config['API_KEY'] = os.environ.get('API_KEY')
    assert len(config['API_KEY']) > 0, 'API_KEY must be non-empty string'

    config['LOG_LEVEL'] = os.environ.get('LOG_LEVEL', 'info')
    assert config['LOG_LEVEL'] in ['trace', 'debug', 'info'], \
        'LOG_LEVEL must be one of: trace, debug, info'

    config['PORT'] = int(os.environ.get('PORT', 8000))
    config['HOST'] = os.environ.get('HOST', '127.0.0.1')

    return config
