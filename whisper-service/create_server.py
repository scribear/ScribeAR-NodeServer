'''
Function to instantiate FastAPI webserver.
Creates executes the function if this file is run directly using the fastapi CLI.

Functions:
    create_server
'''
import io
import asyncio
from typing import Annotated, Callable
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from model_bases.transcription_model_base import TranscriptionModelBase
from model_factory import ModelKey, model_factory
from load_config import AppConfig, load_config


def create_server(
    config: AppConfig,
    model_factory_func: Callable[[ModelKey, WebSocket], TranscriptionModelBase]
) -> FastAPI:
    '''
    Instanciates FastAPI webserver.

    Parameters:
    config              (Config)  : Application configuration object
    model_factory_func  (function): Function that takes in a modelKey and a WebSocket and 
                                    returns the corresponding model implementation

    Returns:
    FastAPI webserver
    '''
    fastapi_app = FastAPI()

    @fastapi_app.websocket("/whisper")
    async def whisper(
        websocket: WebSocket,
        api_key: Annotated[str | None, Query()] = None,
        model_key: Annotated[str | None, Query()] = None
    ):
        '''
        Parameters:
        api_key     (str): Secret API key passed in through URL query parameters
        model_key   (str): Unique model key passed in through URL query parameters
        '''
        await websocket.accept()

        # Reject invalid API keys after a timeout
        if api_key != config.API_KEY:
            await asyncio.sleep(5)
            await websocket.send_text('Invalid API key!')
            await websocket.close()
            return

        # Intanciate and setup requested model
        transcription_model = model_factory_func(model_key, websocket)
        transcription_model.load_model()

        # Send any audio chunks to transcription model
        while True:
            try:
                data = await websocket.receive_bytes()
                await transcription_model.queue_audio_chunk(io.BytesIO(data))
            except WebSocketDisconnect:
                transcription_model.unload_model()
                return

    return fastapi_app


if __name__ == 'create_server':
    app_config = load_config()
    app = create_server(app_config, model_factory)
