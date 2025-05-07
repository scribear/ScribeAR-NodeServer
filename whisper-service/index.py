'''
Entry point for whisper-service application.
'''
import sys
import uvicorn
from app_config.load_config import load_config
from app_config.init_device_config import init_device_config
from server.create_server import create_server
from server.helpers.authenticate_websocket import authenticate_websocket
from server.helpers.select_model import select_model
from model_implementations.import_model_implementation import import_model_implementation


config = load_config()
device_config, selection_options = init_device_config('device_config.json')

APP = create_server(
    config,
    device_config,
    selection_options,
    import_model_implementation,
    authenticate_websocket,
    select_model
)

if __name__ == '__main__':
    dev_mode = len(sys.argv) > 1 and sys.argv[1] == '--dev'

    if dev_mode:
        APP = 'index:APP'
        print(config)
        print(device_config)

    uvicorn.run(
        APP,
        log_level=config['LOG_LEVEL'],
        port=config['PORT'],
        host=config['HOST'],
        use_colors=dev_mode,
        reload=dev_mode
    )
