from modelBases.bufferAudioModelBase import BufferAudioModelBase
from pywhispercpp.model import Model


class WhisperCpp(BufferAudioModelBase):
    '''
    Implementation of WhisperModel using whisper cpp.
    '''

    def __init__(self, ws, modelPath: str, *args, **kwargs):
        super().__init__(ws, *args, **kwargs)
        self.modelPath = modelPath

    def loadModel(self):
        self.model = Model(self.modelPath)

    async def processSegment(self, audioSegment, audioSegmentStartTime):
        transcriptions = self.model.transcribe(audioSegment)

        for segment in transcriptions:
            start = segment.t0 / 100
            end = segment.t1 / 100
            await self.onFinalTranscript(
                segment.text,
                audioSegmentStartTime + start,
                audioSegmentStartTime + end
            )
        return len(audioSegment)

    def unloadModel(self):
        pass
