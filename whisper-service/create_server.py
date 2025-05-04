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
from load_config import AppConfig
from init_device_config import DeviceConfig


def create_server(
    config: AppConfig,
    device_config: DeviceConfig,
    model_factory_func: Callable[[DeviceConfig,
                                  str, WebSocket], TranscriptionModelBase]
) -> FastAPI:
    '''
    Instanciates FastAPI webserver.

    Parameters:
    config              (AppConfig)   : Application configuration object
    device_config       (DeviceConfig): Application device configuration object
    model_factory_func  (function)    : Function that takes in a modelKey and a WebSocket and 
                                          returns the corresponding model implementation

    Returns:
    FastAPI webserver
    '''
    fastapi_app = FastAPI()

    @fastapi_app.get("/healthcheck")
    def healthcheck():
        return 'ok'

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
        transcription_model = model_factory_func(
            device_config,
            model_key,
            websocket
        )
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
