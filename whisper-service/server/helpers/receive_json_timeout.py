'''
Helper function for receving JSON data from a websocket with a timeout

Functions:
    receive_json_timeout
'''
import json
import asyncio
from fastapi import WebSocket


async def receive_json_timeout(websocket: WebSocket):
    '''
    Helper function for receving JSON data from a websocket with a timeout

    Parameters:
    websocket         (WebSocket)       : Opened FastAPI websocket

    Returns:
    Parsed JSON object
    '''
    return json.loads(
        await asyncio.wait_for(
            websocket.receive_text(),
            timeout=5
        )
    )
