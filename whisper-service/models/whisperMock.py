from whisperModelBase import WhisperModelBase

class WhisperMock(WhisperModelBase):
  def loadModel(self):
    pass

  async def queueAudioChunk(self, chunk):
    await self.onFinalTranscript('Here are some totally real, not fake transcriptions.')

  def unloadModel(self):
    pass