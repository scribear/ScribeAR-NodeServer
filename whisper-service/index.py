import uvicorn
from loadConfig import loadConfig
from createServer import createServer

if __name__ == '__main__':
    config = loadConfig()
    app = createServer()

    uvicorn.run(
        app,
        log_level=config.LOG_LEVEL,
        port=config.PORT,
        host=config.HOST
    )
