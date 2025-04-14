import os
import pytest
import unittest.mock as mock
from fastapi import WebSocket
from fastapi.testclient import TestClient
from load_config import Config
from model_bases.whisper_model_base import WhisperModelBase

from create_server import createServer


@pytest.fixture
def fakeConfig():
    config = Config()
    config.API_KEY = 'SOME_API_KEY'
    config.LOG_LEVEL = 'info'
    config.PORT = -1
    config.HOST = '127.0.0.1'
    return config


@pytest.fixture
def fakeWhisperModel():
    class FakeWhisperModel(WhisperModelBase):
        def __init__(self):
            super().__init__(None)

        def loadModel(self):
            return None

        def unloadModel(self):
            return None

        async def queueAudioChunk(self, chunk):
            return None

    return mock.Mock(wraps=FakeWhisperModel())


@pytest.fixture
def fakeModelFactory(fakeWhisperModel):
    def fakeFactory(modelKey: str, ws: WebSocket):
        if modelKey == 'test-model':
            return fakeWhisperModel
        else:
            return None
    return fakeFactory


@pytest.fixture
def app(fakeConfig, fakeModelFactory):
    return createServer(fakeConfig, fakeModelFactory)


@pytest.fixture
def client(app):
    return TestClient(app)


def test_mock_whisper(client, fakeConfig, fakeWhisperModel):
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
        assert os.path.exists(wav_file), "Test wav file not found"

        with open(wav_file, "rb") as f:
            wav_data.append(f.read())


    url = f"/whisper?apiKey={fakeConfig.API_KEY}&modelKey=test-model"
    with client.websocket_connect(url) as websocket:
        for data in wav_data:
            websocket.send_bytes(data)
        websocket.close()


    fakeWhisperModel.loadModel.assert_called_once()
    fakeWhisperModel.unloadModel.assert_called_once()

    call_count = fakeWhisperModel.queueAudioChunk.call_args_list
    assert len(call_count) == len(wav_data), "queueAudioChunk called correct number of times"

    for i, data in enumerate(wav_data):
        method_call = fakeWhisperModel.queueAudioChunk.call_args_list[i]
        call_args = method_call.args
        assert len(call_args) == 1, "Called with corret number of arguments"

        bytesIO_arg = call_args[0]
        assert bytesIO_arg.getvalue() == data, "Correct data transferred"
