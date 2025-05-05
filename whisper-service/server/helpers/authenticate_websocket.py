'''
Helper function to simplify authenticating websocket connections

Functions:
    authenticate_websocket
'''
import json
import logging
import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from custom_types.config_types import AppConfig
from custom_types.authentication_types import WhisperAuthMessage
from server.helpers.receive_json_timeout import receive_json_timeout


async def authenticate_websocket(websocket: WebSocket, config: AppConfig) -> bool:
    '''
    Helper function to authenticate a new websocket

    Parameters:
    websocket (WebSocket): Opened FastAPI websocket
    config    (AppConfig): Application configuration object

    Returns:
    True is successfully authenticated, False otherwise
    '''
    logger = logging.getLogger('uvicorn.error')
    try:
        auth_message: WhisperAuthMessage = await receive_json_timeout(websocket)
    except json.JSONDecodeError:
        logger.info(
            'Authentication Failed: Invalid authentication message')
        await websocket.send_text('Authentication Failed: Invalid authentication message')
        return False
    except asyncio.TimeoutError:
        logger.info('Authentication Timeout: No api_key received in time')
        await websocket.send_text('Authentication Timeout: No api_key received in time')
        return False
    except WebSocketDisconnect:
        logger.info('Authentication Failed: Websocket closed')
        return False

    # Reject invalid API keys
    if 'api_key' not in auth_message or auth_message['api_key'] != config['API_KEY']:
        logger.info('Authentication Failed: Invalid key')
        await websocket.send_text('Authentication Failed: Invalid key')
        return False

    return True
