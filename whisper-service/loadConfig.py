from dotenv import load_dotenv
import os


class Config:
    API_KEY: str
    LOG_LEVEL: str
    PORT: int
    HOST: str


def loadConfig():
    load_dotenv()

    config = Config()
    config.API_KEY = os.environ.get('API_KEY', '')
    config.LOG_LEVEL = os.environ.get('LOG_LEVEL', 'info')
    config.PORT = int(os.environ.get('PORT', 8000))
    config.HOST = os.environ.get('HOST', '127.0.0.1')

    return config
