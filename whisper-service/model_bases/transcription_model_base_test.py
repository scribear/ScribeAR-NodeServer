'''
Unit tests for TranscriptionModelBase class
'''
# pylint: disable=redefined-outer-name
import pytest
from model_bases.transcription_model_base import \
    TranscriptionModelBase, BackendTranscriptionBlockType

fake_config = {
    'some_param': 'string',
    'another_param': 0,
    'nested_param': {
        'array_param': ['erased']
    }
}
returned_fake_config = {
    'some_param': 'str',
    'another_param': 1,
    'nested_param': {
        'array_param': []
    }
}


class FakeWebSocket:
    '''
    Simple fake websocket to capture what send_json is called with.
    '''

    def __init__(self):
        self.sent_messages = []

    async def send_json(self, message):
        '''
        Records what send_json() is called with
        '''
        self.sent_messages.append(message)

    def get_sent_messages(self):
        '''
        Get record of what send_json() was called with
        '''
        return self.sent_messages


@pytest.fixture(scope='function')
def fake_implementation():
    '''
    Create a fake transcription model for each test
    '''
    class Fake(TranscriptionModelBase):
        '''
        Fake transcription model to track how object's methods are called
        '''
        @staticmethod
        def validate_config(config):
            return returned_fake_config

        def load_model(self):
            return None

        def unload_model(self):
            return None

        async def queue_audio_chunk(self, audio_chunk):
            return None

    return Fake


@pytest.mark.asyncio
async def test_on_final_transcript(fake_implementation):
    '''
    Test that on_final_transcript_block() sends correct websocket message
    '''
    fake_ws = FakeWebSocket()
    model_base = fake_implementation(fake_ws, fake_config)

    await model_base.on_final_transcript_block("Hello world", start=0, end=1)

    assert len(fake_ws.get_sent_messages()) == 1
    message = fake_ws.get_sent_messages()[0]
    assert message['type'] == BackendTranscriptionBlockType.FINAL
    assert message['text'] == "Hello world"
    assert message['start'] == 0
    assert message['end'] == 1


@pytest.mark.asyncio
async def test_on_in_progress_transcript(fake_implementation):
    '''
    Test that on_in_progress_transcript_block() sends correct websocket message
    '''
    fake_ws = FakeWebSocket()
    model_base = fake_implementation(fake_ws, fake_config)

    await model_base.on_in_progress_transcript_block("Processing...", start=0, end=1)

    assert len(fake_ws.get_sent_messages()) == 1
    message = fake_ws.get_sent_messages()[0]
    assert message['type'] == BackendTranscriptionBlockType.IN_PROGRESS
    assert message['text'] == "Processing..."
    assert message['start'] == 0
    assert message['end'] == 1


def test_validate_config_called(fake_implementation):
    '''
    Test that validate_config() is called when model is instantiated and 
    return value is set as config property
    '''
    fake_config = {
        'some_param': 'str',
        'another_param': 1,
        'nested_param': {
            'array_param': []
        }
    }
    fake_ws = FakeWebSocket()
    model = fake_implementation(fake_ws, fake_config)

    assert model.config == returned_fake_config, 'config property not set'
