import uvicorn
from load_config import loadConfig
from create_server import createServer

if __name__ == '__main__':
    config = loadConfig()
    app = createServer(config)

    uvicorn.run(
        app,
        log_level=config.LOG_LEVEL,
        port=config.PORT,
        host=config.HOST
    )
