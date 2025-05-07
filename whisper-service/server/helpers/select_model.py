'''
Helper function to simplify model selection over a websocket connection

Functions:
    select_model
'''
import json
import asyncio
import logging
from typing import Literal
from fastapi import WebSocket, WebSocketDisconnect
from custom_types.config_types import DeviceConfig
from custom_types.model_selection_types import SelectionOptions, SelectedOption
from server.helpers.receive_json_timeout import receive_json_timeout


async def select_model(
    websocket: WebSocket,
    device_config: DeviceConfig,
    selection_options: SelectionOptions
) -> SelectedOption | Literal[False]:
    '''
    Helper function to get model selection from a new websocket

    Parameters:
    websocket         (WebSocket)       : Opened FastAPI websocket
    device_config     (DeviceConfig)    : Application device configuration object
    selection_options (SelectionOptions): Available selection options to send to frontend

    Returns:
    SelectOption is successfully parsed selection, False otherwise
    '''
    logger = logging.getLogger('uvicorn.error')

    await websocket.send_json(selection_options)

    try:
        model_selection: SelectedOption = await receive_json_timeout(websocket)
    except json.JSONDecodeError:
        logger.info(
            'Model Selection Failed: Invalid model selection message')
        await websocket.send_json({
            'error': True,
            'msg': 'Model Selection Failed: Invalid model selection message'
        })
        return False
    except asyncio.TimeoutError:
        logger.info(
            'Model Selection Timeout: No selection received in time')
        await websocket.send_json({
            'error': True,
            'msg': 'Model Selection Timeout: No selection received in time'
        })
        return False
    except WebSocketDisconnect:
        logger.info('Model Selection Failed: Websocket closed')
        return False

    if 'model_key' not in model_selection:
        logger.info('Model Selection Failed: No model_key provided')
        await websocket.send_json({
            'error': True,
            'msg': 'Model Selection Failed: No model_key provided'
        })
        return False

    if model_selection['model_key'] not in device_config:
        logger.info('Model Selection Failed: Invalid model_key provided')
        await websocket.send_json({
            'error': True,
            'msg': 'Model Selection Failed: Invalid model_key provided'
        })
        return False

    return model_selection
