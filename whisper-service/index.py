'''
Entry point for whisper-service application.
'''
import sys
import uvicorn
from load_config import load_config
from create_server import create_server
from model_factory import model_factory
from init_device_config import init_device_config

config = load_config()
device_config = init_device_config('device_config.json')
APP = create_server(config, device_config, model_factory)

if __name__ == '__main__':
    dev_mode = len(sys.argv) > 1 and sys.argv[1] == '--dev'

    if dev_mode:
        APP = 'index:app'

    uvicorn.run(
        APP,
        log_level=config.LOG_LEVEL,
        port=config.PORT,
        host=config.HOST,
        use_colors=dev_mode,
        reload=dev_mode
    )
