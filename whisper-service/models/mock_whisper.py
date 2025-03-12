from model_bases.whisper_model_base import WhisperModelBase
import wave


class MockWhisper(WhisperModelBase):
    '''
    Dummy WhisperModel implementation that returns the duration of recieved audio as "transcription"
    '''
    time = 0

    def loadModel(self):
        pass

    async def queueAudioChunk(self, chunk):
        infofile = wave.open(chunk, 'r')
        frames = infofile.getnframes()
        rate = infofile.getframerate()

        duration = frames / float(rate)

        start = self.time
        self.time += duration

        await self.onFinalTranscript(f'Received {duration} seconds of audio.', start, self.time)

    def unloadModel(self):
        pass
