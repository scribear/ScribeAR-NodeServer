from modelBases.segmentAudioModelBase import SegmentAudioModelBase
import numpy.typing as npt
import math

sentenceEnds = ('.', '?', '!')
sentenceEndsWhitelist = ('...')


class TranscriptionSegment:
    __slots__ = ['text', 'start', 'end']

    def __init__(self, text: str, start: float, end: float):
        self.text = text
        self.start = start
        self.end = end

    def __repr__(self):
        return f'[{self.start:6.2f} - {self.end:6.2f}] {self.text}'


class LocalAgreeModelBase(SegmentAudioModelBase):
    __slots__ = ['prevText', 'localAgreeDim', 'prevTranscriptions']
    def __init__(self, ws, localAgreeDim=2, *args, **kwargs):
        super().__init__(ws, *args, **kwargs)

        self.prevText = ''
        self.localAgreeDim = localAgreeDim
        self.prevTranscriptions: list[list[TranscriptionSegment]] = []

    async def transcribeAudio(self, audioSegment: npt.NDArray, prevText: str) -> list[TranscriptionSegment]:
        '''
        Transcribe audio into TranscriptionSegments containing text, start, and end times (relative to start of audio segment)
        audioSegment is a numpy array containing float16 audio normalized to [-1, 1] at 16k sample rate
        returns a list of TranscriptionSegments
        '''
        raise Exception('Must implement per model')

    async def processSegment(self, audioSegment, audioSegmentStartTime):
        segments = await self.transcribeAudio(audioSegment, self.prevText)

        # Extract segments that satisfy local agreement
        finalText = ''
        finalEndIdx = 0
        finalEndTime = 0
        for i in range(min(len(segments), self.maxLocalAgreeLen())):
            if not self.localAgree(segments[i], i):
                break
            finalText += segments[i].text

            if finalText.endswith(sentenceEnds) and not finalText.endswith(sentenceEndsWhitelist):
                start = finalEndTime
                finalEndTime = max(finalEndTime, segments[i].end)

                self.prevText = finalText
                await self.onFinalTranscript(finalText, audioSegmentStartTime + start, audioSegmentStartTime + finalEndTime)
                finalEndIdx = i + 1
                finalText = ''

        # If max segment length has been reached, force finalization of some text
        if (len(audioSegment) >= self.maxSegmentSamples):
            start = finalEndTime
            forcedFinalText = ''
            while finalEndIdx < len(segments) and finalEndTime < self.minNewSamples / self.SAMPLE_RATE:
                forcedFinalText += segments[i].text
                finalEndTime = max(finalEndTime, segments[i].end)
            await self.onFinalTranscript(forcedFinalText, audioSegmentStartTime + start, audioSegmentStartTime + finalEndTime)

        # Output remaining text as in progress transcription
        inprogress = ''
        inprogressEndTime = finalEndTime
        for i in range(finalEndIdx, len(segments)):
            inprogress += segments[i].text
            inprogressEndTime = max(inprogressEndTime, segments[i].end)
        await self.onInProgressTranscript(inprogress, audioSegmentStartTime + finalEndTime, audioSegmentStartTime + inprogressEndTime)

        # Update transcription history
        self.prevTranscriptions.append(segments)
        if len(self.prevTranscriptions) >= self.localAgreeDim:
            self.prevTranscriptions.pop(0)
        return min(int(finalEndTime * self.SAMPLE_RATE), len(audioSegment))

    def localAgree(self, segment: TranscriptionSegment, index: int):
        if len(self.prevTranscriptions) != self.localAgreeDim - 1:
            return False
        for transcription in self.prevTranscriptions:
            if segment.text != transcription[index].text:
                return False
        return True

    def maxLocalAgreeLen(self):
        if len(self.prevTranscriptions) == 0:
            return math.inf
        return min([len(transcription) for transcription in self.prevTranscriptions])
