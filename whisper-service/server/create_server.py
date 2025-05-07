'''
Function to instantiate FastAPI webserver.
Creates executes the function if this file is run directly using the fastapi CLI.

Functions:
    create_server
'''
# pylint: disable=too-many-arguments,too-many-positional-arguments
import io
from typing import Callable, Type, Literal
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from model_bases.transcription_model_base import TranscriptionModelBase
from custom_types.config_types import AppConfig, DeviceConfig, ModelImplementationId
from custom_types.model_selection_types import SelectionOptions, SelectedOption


def create_server(
    config: AppConfig,
    device_config: DeviceConfig,
    selection_options: SelectionOptions,
    import_implementation_fun: Callable[[ModelImplementationId], Type[TranscriptionModelBase]],
    authenticate_websocket_fun: Callable[[WebSocket, AppConfig], bool],
    select_model_fun: Callable[
        [WebSocket, DeviceConfig, SelectionOptions], SelectedOption | Literal[False]
    ]
) -> FastAPI:
    '''
    Instanciates FastAPI webserver.

    Parameters:
    config                    (AppConfig): Application configuration object
    device_config          (DeviceConfig): Application device configuration object
    selection_options  (SelectionOptions): Available selection options to send to frontend
    import_implementation_fun  (function): Function that takes in a modelKey and a WebSocket and 
                                            returns the corresponding model implementation class
    authenticate_websocket_fun (function): Function that authenticates a websocket
                                            returns True is successful, False otherwise
    select_model_fun           (function): Function that get model selection from websocket
                                            returns received selection, False on error

    Returns:
    FastAPI webserver
    '''
    fastapi_app = FastAPI()

    @fastapi_app.websocket("/sourcesink")
    async def sourcesink(websocket: WebSocket):
        '''
        Parameters:
        api_key (str): Secret API key passed in through URL query parameters
        '''
        await websocket.accept()

        if not await authenticate_websocket_fun(websocket, config):
            return await websocket.close()

        selected_option = await select_model_fun(websocket, device_config, selection_options)
        if not selected_option:
            return await websocket.close()

        model_key = selected_option['model_key']

        # Create and setup requested model
        model_config = device_config[model_key]
        implementation = import_implementation_fun(
            model_config['implementation_id']
        )
        transcription_model = implementation(
            websocket,
            model_config['implementation_configuration']
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

    @fastapi_app.get("/healthcheck")
    def healthcheck():
        '''
        Simple healthcheck endpoint to see if server is alive
        '''
        return 'ok'

    return fastapi_app
