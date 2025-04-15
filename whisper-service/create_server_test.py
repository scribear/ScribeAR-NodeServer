'''
Unit tests for create_server function.
'''
# pylint: disable=redefined-outer-name
import os
from unittest import mock
import pytest
from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect
from fastapi.testclient import TestClient
from load_config import AppConfig
from model_bases.transcription_model_base import TranscriptionModelBase

from create_server import create_server


@pytest.fixture(scope='function')
def fake_config():
    '''
    Create a fake configuration object for each test
    '''
    config = AppConfig()
    config.API_KEY = 'SOME_API_KEY'
    config.LOG_LEVEL = 'info'
    config.PORT = -1
    config.HOST = '127.0.0.1'
    return config


@pytest.fixture(scope='function')
def fake_transcription_model():
    '''
    Create a fake transcription model for each test
    '''
    class Fake(TranscriptionModelBase):
        '''
        Fake transcription model to track how object's methods are called
        '''
        def __init__(self):
            super().__init__(None)

        def load_model(self):
            return None

        def unload_model(self):
            return None

        async def queue_audio_chunk(self, audio_chunk):
            return None

    return mock.Mock(wraps=Fake())


@pytest.fixture(scope='function')
def fake_model_factory(fake_transcription_model):
    '''
    Create a fake model factory for each test 
    '''
    def fake_factory(model_key: str, ws: WebSocket):
        if isinstance(ws, WebSocket) and model_key == 'test-model':
            return fake_transcription_model

        raise NotImplementedError('Invalid model key or invalid websocket argument.')
    return fake_factory


@pytest.fixture(scope='function')
def app(fake_config, fake_model_factory):
    '''
    Create a FastAPI app for each test
    '''
    return create_server(fake_config, fake_model_factory)


@pytest.fixture(scope='function')
def client(app):
    '''
    Create a FastAPI test client for each test
    '''
    return TestClient(app)


def test_accepts_valid_api_key(client, fake_config, fake_transcription_model):
    '''
    Test that websocket handler passes audio chunks to transcription model
    '''
    wav_files = [
        "../test-audio-files/wikipedia-.fun/chunked/chunk_000.wav",
        "../test-audio-files/wikipedia-.fun/chunked/chunk_001.wav",
        "../test-audio-files/wikipedia-.fun/chunked/chunk_002.wav",
        "../test-audio-files/wikipedia-.fun/chunked/chunk_003.wav",
        "../test-audio-files/wikipedia-.fun/chunked/chunk_004.wav",
        "../test-audio-files/wikipedia-.fun/chunked/chunk_005.wav",
        "../test-audio-files/wikipedia-.fun/chunked/chunk_006.wav",
        "../test-audio-files/wikipedia-.fun/chunked/chunk_007.wav",
    ]
    wav_data = []
    for wav_file in wav_files:
        file_path = os.path.join(os.path.dirname(__file__), wav_file)
        assert os.path.exists(file_path), "Test wav file not found"

        with open(file_path, "rb") as f:
            wav_data.append(f.read())

    url = f"/whisper?api_key={fake_config.API_KEY}&model_key=test-model"
    with client.websocket_connect(url) as websocket:
        for data in wav_data:
            websocket.send_bytes(data)
        websocket.close()

    fake_transcription_model.load_model.assert_called_once()
    fake_transcription_model.unload_model.assert_called_once()

    call_count = fake_transcription_model.queue_audio_chunk.call_args_list
    assert len(call_count) == len(
        wav_data), "queueAudioChunk called correct number of times"

    for i, data in enumerate(wav_data):
        method_call = fake_transcription_model.queue_audio_chunk.call_args_list[i]
        call_args = method_call.args
        assert len(call_args) == 1, "Called with correct number of arguments"

        bytes_io_arg = call_args[0]
        assert bytes_io_arg.getvalue() == data, "Correct data transferred"


def test_rejects_invalid_api_key(client):
    '''
    Test that websocket handler closes connection if invalid api key is given
    '''
    url = "/whisper?api_key=NOT_API_KEY&model_key=test-model"
    with client.websocket_connect(url) as websocket:
        response = websocket.receive_text()
        assert response == 'Invalid API key!', "Rejects invalid API key"

        # Should disconnect socket after
        with pytest.raises(WebSocketDisconnect):
            websocket.receive_json()
