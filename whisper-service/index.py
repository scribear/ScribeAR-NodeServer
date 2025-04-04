import uvicorn
from load_config import loadConfig
from create_server import createServer

config = loadConfig()
app = createServer(config)