import os
from dotenv import load_dotenv
from typing import Annotated
from modelFactory import modelFactory
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
import io
import uvicorn

load_dotenv()
API_KEY = os.environ.get('API_KEY', '')
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'info')
PORT = int(os.environ.get('PORT', 8000))
HOST = os.environ.get('HOST', '127.0.0.1')

app = FastAPI()


@app.websocket("/whisper")
async def whisper(websocket: WebSocket, apiKey: Annotated[str | None, Query()] = None, modelKey: Annotated[str | None, Query()] = None):
    if (apiKey != API_KEY):
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


if __name__ == '__main__':
    uvicorn.run(app, log_level=LOG_LEVEL, port=PORT, host=HOST)
