'''
Unit tests for TranscriptionModelBase class
'''
import pytest
from model_bases.transcription_model_base import \
    TranscriptionModelBase, BackendTranscriptionBlockType


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


@pytest.mark.asyncio
async def test_on_final_transcript():
    '''
    Test that on_final_transcript_block() sends correct websocket message
    '''
    fake_ws = FakeWebSocket()
    model_base = TranscriptionModelBase(fake_ws)

    await model_base.on_final_transcript_block("Hello world", start=0, end=1)

    assert len(fake_ws.get_sent_messages()) == 1
    message = fake_ws.get_sent_messages()[0]
    assert message['type'] == BackendTranscriptionBlockType.FINAL
    assert message['text'] == "Hello world"
    assert message['start'] == 0
    assert message['end'] == 1


@pytest.mark.asyncio
async def test_on_in_progress_transcript():
    '''
    Tests that on_in_progress_transcript_block() sends correct websocket message
    '''
    fake_ws = FakeWebSocket()
    model_base = TranscriptionModelBase(fake_ws)

    await model_base.on_in_progress_transcript_block("Processing...", start=0, end=1)

    assert len(fake_ws.get_sent_messages()) == 1
    message = fake_ws.get_sent_messages()[0]
    assert message['type'] == BackendTranscriptionBlockType.IN_PROGRESS
    assert message['text'] == "Processing..."
    assert message['start'] == 0
    assert message['end'] == 1
