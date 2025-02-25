import os
from dotenv import load_dotenv
from typing import Annotated
from whisperModelFactory import whisperModelFactory
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
import io

load_dotenv()
API_KEY = os.environ.get('API_KEY', '')

app = FastAPI()


@app.websocket("/whisper")
async def whisper(websocket: WebSocket, apiKey: Annotated[str | None, Query()] = None, modelKey: Annotated[str | None, Query()] = None):
    if (apiKey != API_KEY):
        return
        
    await websocket.accept()

    whisperModel = whisperModelFactory(modelKey, websocket)
    whisperModel.loadModel()

    while True:
        try:
            data = await websocket.receive_bytes()
            await whisperModel.queueAudioChunk(io.BytesIO(data))
        except WebSocketDisconnect:
            whisperModel.unloadModel()
            return