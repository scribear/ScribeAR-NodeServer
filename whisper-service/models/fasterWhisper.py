from faster_whisper import WhisperModel
from whisperModelBase import WhisperModelBase
import wave
import io


def combineWavBuffers(params, wavFrames):
    combinedBuffer = io.BytesIO()
    with wave.open(combinedBuffer, 'wb') as combinedWAV:
        combinedWAV.setparams(params)
        for frame in wavFrames:
            combinedWAV.writeframes(frame)

    combinedBuffer.seek(0)
    return combinedBuffer


class FasterWhisper(WhisperModelBase):
    def __init__(self, ws, modelSize):
        super().__init__(ws)
        self.modelSize = modelSize

        self.params = None
        self.audioBufferDuration = 0
        self.wavFrames = []

    def loadModel(self):
        self.model = WhisperModel(self.modelSize)

    async def queueAudioChunk(self, chunk):
        # There's probably a better way to do this, this is temporary
        with wave.open(chunk, 'rb') as chunkBuffer:
            self.params = chunkBuffer.getparams()

            numFrames = chunkBuffer.getnframes()
            frames = chunkBuffer.readframes(numFrames)
            rate = chunkBuffer.getframerate()

            self.audioBufferDuration += numFrames / float(rate)
            self.wavFrames.append(frames)

        if self.audioBufferDuration > 5:
            audioBuffer = combineWavBuffers(self.params, self.wavFrames)

            segments, _ = self.model.transcribe(audioBuffer)
            text = "".join(segment.text for segment in segments)

            self.audioBufferDuration = 0
            self.wavFrames = []

            await self.onFinalTranscript(text)

    def unloadModel(self):
        if self.model and self.model.model.model_is_loaded:
            self.model.model.unload_model()
