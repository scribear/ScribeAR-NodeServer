from whisperModelBase import WhisperModelBase
import wave
class WhisperMock(WhisperModelBase):
  def loadModel(self):
    pass

  async def queueAudioChunk(self, chunk):
    infofile = wave.open(chunk, 'r')
    frames = infofile.getnframes()
    rate = infofile.getframerate()

    duration = frames / float(rate)
    await self.onFinalTranscript(f'Received {duration} seconds of audio.')

  def unloadModel(self):
    pass