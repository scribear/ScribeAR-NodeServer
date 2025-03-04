from modelBases.whisperModelBase import WhisperModelBase
from utils.npCircularBuffer import NPCircularBuffer
from utils.decodeWav import decodeWav
import numpy as np
import numpy.typing as npt



class SegmentAudioModelBase(WhisperModelBase):
    SAMPLE_RATE = 16_000

    def __init__(self, ws, maxSegmentSamples=SAMPLE_RATE * 30, minNewSamples=SAMPLE_RATE):
        super().__init__(ws)
        self.maxSegmentSamples = maxSegmentSamples
        self.minNewSamples = minNewSamples

        self.lastProcessedSamples = 0
        self.startTime = 0.0
        self.buffer = NPCircularBuffer(maxSegmentSamples, dtype=np.float16)

    async def processSegment(self, audioSegment: npt.NDArray, audioSegmentStartTime: float) -> int:
        '''
        Called when an audio segment is ready to be transcribed
        audioSegment is a numpy array containing float16 audio normalized to [-1, 1] at 16k sample rate
            It contains at least minNewSegments samples that are new since last transcripts
            It also contains at most maxSegmentSamples samples
        audioSegmentStartTime is the timestamp of the start of the provided audioSegment
        Note: Once audioSegment hits maxSegmentSamples, you should return a nonzero value
            Otherwise, the buffer never shrinks and processSegment could be called in an infinite loop
        returns number samples of audio to purge from audio buffer
        '''
        raise Exception('Must implement per model')

    async def queueAudioChunk(self, chunk):
        audio = decodeWav(chunk)
        extraAudio = self.buffer.appendSequence(audio)

        # If buffer is full, process segments until entire audio chunk can be inserted into buffer
        while len(extraAudio) > 0:
            samplesToCut = await self.processSegment(self.buffer.getCurrBuffer(), self.startTime)
            
            self.buffer.shiftBuffer(samplesToCut)
            self.startTime += samplesToCut / self.SAMPLE_RATE
            self.lastProcessedSamples = len(self.buffer)

            extraAudio = self.buffer.appendSequence(extraAudio)

        if (len(self.buffer) - self.lastProcessedSamples) > self.minNewSamples:
            samplesToCut = await self.processSegment(self.buffer.getCurrBuffer(), self.startTime)
            
            self.buffer.shiftBuffer(samplesToCut)
            self.startTime += samplesToCut / self.SAMPLE_RATE
            self.lastProcessedSamples = len(self.buffer)
