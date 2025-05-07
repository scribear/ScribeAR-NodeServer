'''
Unit tests for create_server function.
'''
# pylint: disable=redefined-outer-name,too-many-locals,unused-argument
import os
from pytest_mock import MockerFixture
from fastapi import WebSocket
from fastapi.testclient import TestClient
from app_config.load_config import AppConfig
from model_bases.transcription_model_base import TranscriptionModelBase
from server.create_server import create_server


# Load some test files to send through websocket
wav_files = [
    "../../test-audio-files/wikipedia-.fun/chunked/chunk_000.wav",
    "../../test-audio-files/wikipedia-.fun/chunked/chunk_001.wav",
    "../../test-audio-files/wikipedia-.fun/chunked/chunk_002.wav",
    "../../test-audio-files/wikipedia-.fun/chunked/chunk_003.wav",
    "../../test-audio-files/wikipedia-.fun/chunked/chunk_004.wav",
    "../../test-audio-files/wikipedia-.fun/chunked/chunk_005.wav",
    "../../test-audio-files/wikipedia-.fun/chunked/chunk_006.wav",
    "../../test-audio-files/wikipedia-.fun/chunked/chunk_007.wav",
]
wav_data = []
for wav_file in wav_files:
    file_path = os.path.join(os.path.dirname(__file__), wav_file)
    assert os.path.exists(file_path), "Test wav file not found"

    with open(file_path, "rb") as f:
        wav_data.append(f.read())


fake_config = AppConfig()
fake_config['API_KEY'] = 'SOME_API_KEY'
fake_config['LOG_LEVEL'] = 'info'
fake_config['PORT'] = -1
fake_config['HOST'] = '127.0.0.1'

fake_device_config = {
    'model_key_1': {
        'display_name': 'Model Name',
        'description': 'Some description',
        'implementation_id': 'implementation_id_1',
        'implementation_configuration': {
            'some': 'config',
            'key': 10,
        },
        'available_features': {}
    },
}

fake_selection_options = [{
    'model_key': 'model_key_1'
}]


class FakeModelImplementation(TranscriptionModelBase):
    '''
    Create a fake transcription model implementation for each test
    '''
    @staticmethod
    def validate_config(config):
        return config

    def load_model(self):
        return None

    def unload_model(self):
        return None

    async def queue_audio_chunk(self, audio_chunk):
        return None


def import_fun(key):
    '''
    Fake import function to return FakeModelImplementation
    '''
    if key == 'implementation_id_1':
        return FakeModelImplementation
    raise KeyError('Invalid Key')


async def auth_fun(*args):
    '''
    Fake authenticate websocket function to skip authentication
    '''
    return True


async def select_model(*args):
    '''
    Fake select model function to skip model selection
    '''
    return {
        'model_key': 'model_key_1',
        'feature_selection': {}
    }


def test_loads_unloads_model(mocker: MockerFixture,):
    '''
    Test that websocket handler instanciates and loads model correctly
    '''
    init_spy = mocker.spy(FakeModelImplementation, '__init__')
    load_spy = mocker.spy(FakeModelImplementation, 'load_model')
    unload_spy = mocker.spy(FakeModelImplementation, 'unload_model')

    app = create_server(
        fake_config,
        fake_device_config,
        fake_selection_options,
        import_fun,
        auth_fun,
        select_model
    )
    test_client = TestClient(app)

    with test_client.websocket_connect("/sourcesink") as websocket:
        websocket.close()

    load_spy.assert_called_once()
    unload_spy.assert_called_once()

    assert init_spy.call_args_list[0].args[1].__class__ == WebSocket, \
        'Model initialized with websocket'
    assert init_spy.call_args_list[0].args[2] == \
        fake_device_config['model_key_1']['implementation_configuration'], \
        'Model initinalized with implementation config'


def test_queues_audio_chunks(mocker: MockerFixture,):
    '''
    Test that websocket handler instanciates and loads model correctly
    '''
    queue_spy = mocker.spy(FakeModelImplementation, 'queue_audio_chunk')

    app = create_server(
        fake_config,
        fake_device_config,
        fake_selection_options,
        import_fun,
        auth_fun,
        select_model
    )
    test_client = TestClient(app)

    with test_client.websocket_connect("/sourcesink") as websocket:
        for wav in wav_data:
            websocket.send_bytes(wav)

    assert queue_spy.call_count == len(wav_data), \
        "queue_audio_chunk called correct number of times"
    for i, data in enumerate(wav_data):
        assert queue_spy.call_args_list[i].args[1].getvalue() == data, \
            "Correct data transferred"
