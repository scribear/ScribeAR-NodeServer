'''
Entry point for whisper-service application.
'''
import uvicorn
from load_config import load_config
from create_server import create_server
from model_factory import model_factory

if __name__ == '__main__':
    config = load_config()
    app = create_server(config, model_factory)

    uvicorn.run(
        app,
        log_level=config.LOG_LEVEL,
        port=config.PORT,
        host=config.HOST
    )
