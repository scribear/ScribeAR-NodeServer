from typing import Annotated, Callable
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from model_bases.whisper_model_base import WhisperModelBase
from load_config import Config
import io
import asyncio

def createServer(config: Config, modelFactory: Callable[[], WhisperModelBase]):
    app = FastAPI()

    @app.websocket("/whisper")
    async def whisper(websocket: WebSocket, apiKey: Annotated[str | None, Query()] = None, modelKey: Annotated[str | None, Query()] = None):
        await websocket.accept()
        if (apiKey != config.API_KEY):
            await asyncio.sleep(1)
            await websocket.send_text('Invalid API key!')
            await websocket.close()
            return

        whisperModel = modelFactory(modelKey, websocket)
        whisperModel.loadModel()

        while True:
            try:
                data = await websocket.receive_bytes()
                await whisperModel.queueAudioChunk(io.BytesIO(data))
            except WebSocketDisconnect:
                whisperModel.unloadModel()
                return
            
    return app


if __name__ == 'create_server':
    from load_config import loadConfig
    from model_factory import modelFactory

    config = loadConfig()
    app = createServer(config, modelFactory)