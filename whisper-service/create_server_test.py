import os
import wave
import pytest
from fastapi.testclient import TestClient
from load_config import loadConfig

from create_server import createServer

from models.mock_whisper import MockWhisper

@pytest.fixture
def config():
    return loadConfig()

@pytest.fixture
def app(config):
    return createServer(config)

@pytest.fixture
def client(app):
    return TestClient(app)

@pytest.fixture
def transcript_collector():
    """
    patch the onFinalTranscript method.
    """
    transcripts = []

    async def fake_onFinalTranscript(self, text, start, end):
        transcripts.append((text, start, end))

    MockWhisper.onFinalTranscript = fake_onFinalTranscript
    return transcripts

def test_mock_whisper(client, config, transcript_collector):
    wav_file = "chunk_000.wav"
    assert os.path.exists(wav_file), "Test wav file not found"

    with open(wav_file, "rb") as f:
        wav_data = f.read()

    with wave.open(wav_file, "r") as wav:
        frames = wav.getnframes()
        rate = wav.getframerate()
    expected_duration = frames / float(rate)

    url = f"/whisper?apiKey={config.API_KEY}&modelKey=mock"
    with client.websocket_connect(url) as websocket:
        websocket.send_bytes(wav_data)
        websocket.close()

    assert len(transcript_collector) == 1, "Expected one transcript callback"
    transcript, start, end = transcript_collector[0]
    expected_text = f"Received {expected_duration} seconds of audio."
    assert transcript == expected_text, "Transcript text did not match expected value"
    assert start == 0, "Start time should be 0"
    assert end == expected_duration, "End time does not match expected duration"
