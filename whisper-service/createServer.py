from typing import Annotated
from modelFactory import modelFactory
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
import io
from loadConfig import Config


def createServer(config: Config):
    app = FastAPI()

    @app.websocket("/whisper")
    async def whisper(websocket: WebSocket, apiKey: Annotated[str | None, Query()] = None, modelKey: Annotated[str | None, Query()] = None):
        if (apiKey != config.API_KEY):
            return

        await websocket.accept()

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


if __name__ == 'createServer':
    from loadConfig import loadConfig

    config = loadConfig()
    app = createServer(config)

    print(__name__)