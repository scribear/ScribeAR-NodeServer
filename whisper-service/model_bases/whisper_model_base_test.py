import pytest
from model_bases.whisper_model_base import WhisperModelBase, BackendTranscriptionBlockType

class DummyWhisper(WhisperModelBase):
    def loadModel(self):
        pass

    async def queueAudioChunk(self, chunk):
        pass

    def unloadModel(self):
        pass

class FakeWebSocket:
    def __init__(self):
        self.sent_messages = []

    async def send_json(self, message):
        self.sent_messages.append(message)

@pytest.mark.asyncio
async def test_on_final_transcript():
    fake_ws = FakeWebSocket()
    dummy = DummyWhisper(fake_ws)
    
    await dummy.onFinalTranscript("Hello world", start=0, end=1)
    
    assert len(fake_ws.sent_messages) == 1
    message = fake_ws.sent_messages[0]
    assert message['type'] == BackendTranscriptionBlockType.Final
    assert message['text'] == "Hello world"
    assert message['start'] == 0
    assert message['end'] == 1

@pytest.mark.asyncio
async def test_on_in_progress_transcript():
    fake_ws = FakeWebSocket()
    dummy = DummyWhisper(fake_ws)
    
    await dummy.onInProgressTranscript("Processing...", start=0, end=1)
    
    assert len(fake_ws.sent_messages) == 1
    message = fake_ws.sent_messages[0]
    assert message['type'] == BackendTranscriptionBlockType.InProgress
    assert message['text'] == "Processing..."
    assert message['start'] == 0
    assert message['end'] == 1
