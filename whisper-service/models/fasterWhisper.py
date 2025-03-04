from faster_whisper import WhisperModel
from modelBases.whisperModelBase import WhisperModelBase
from modelBases.localAgreeModelBase import LocalAgreeModelBase, TranscriptionSegment
from fastapi import WebSocket
import wave
import io
import math

sentenceEnds = ('.', '?', '!')
sentenceEndsWhitelist = ('...')


def localAgreeLen(prevWords: list[list[str]]) -> int:
    if len(prevWords) == 0:
        return math.inf
    return min([len(words) for words in prevWords])


def localAgree(prevWords: list[list[str]], index: int, word: str) -> bool:
    for words in prevWords:
        if words[index] != word:
            return False
    return True

class FasterWhisper(LocalAgreeModelBase):
    def __init__(self, ws: WebSocket, modelSize: str, *args, **kwargs):
        super().__init__(ws, *args, **kwargs)
        self.modelSize = modelSize

    def loadModel(self):
        self.model = WhisperModel(self.modelSize)

    async def transcribeAudio(self, audioSegment, prevText):
        transcription, _ = self.model.transcribe(audioSegment, initial_prompt=prevText, word_timestamps=True)

        segments = []
        for part in transcription:
            for word in part.words:
              segments.append(TranscriptionSegment(word.word, word.start, word.end))
        return segments

    def unloadModel(self):
        if self.model and self.model.model.model_is_loaded:
            self.model.model.unload_model()


# class FasterWhisper(WhisperModelBase):
#     def __init__(self, ws: WebSocket, modelSize: str, modelRunBufferDiffThresh = 2, localAgreeDim = 2, maxBufferLength = 10):
#         super().__init__(ws)
#         self.modelSize = modelSize
#         self.modelRunBufferDiffThresh = modelRunBufferDiffThresh
#         self.localAgreeDim = localAgreeDim
#         self.maxBufferLength = maxBufferLength


#     def loadModel(self):
#         self.model = WhisperModel(self.modelSize)

#         self.nchannels: int = None
#         self.framerate: int = None
#         self.sampwidth: int = None

#         self.audioBufferDuration: int = 0
#         self.audioBuffer = io.BytesIO()
#         self.wavAudioBuffer = wave.open(self.audioBuffer, 'wb')
#         self.initAudioBuffer = True

#         self.prevFinalTime = 0
#         self.prevFinalText = ''
#         self.prevBufferSec = 0

#         self.prevWords: list[list[str]] = [[]] * (self.localAgreeDim - 1)

#     async def queueAudioChunk(self, chunk):
#         with wave.open(chunk, 'rb') as wavChunk:
#             # Audio format should not change midway
#             assert(self.nchannels == None or self.nchannels == wavChunk.getnchannels())
#             assert(self.framerate == None or self.framerate == wavChunk.getframerate())
#             assert(self.sampwidth == None or self.sampwidth == wavChunk.getsampwidth())
#             self.nchannels = wavChunk.getnchannels()
#             self.framerate = wavChunk.getframerate()
#             self.sampwidth = wavChunk.getsampwidth()

#             # Init audio buffer if it doesn't exist
#             if self.initAudioBuffer:
#                 self.initAudioBuffer = False
#                 self.wavAudioBuffer.setframerate(self.framerate)
#                 self.wavAudioBuffer.setnchannels(self.nchannels)
#                 self.wavAudioBuffer.setsampwidth(self.sampwidth)

#             # Write new chunk to audio buffer
#             numframes = wavChunk.getnframes()
#             chunkFrames = wavChunk.readframes(numframes)
#             self.wavAudioBuffer.writeframes(chunkFrames)

#         # Only run model when enough there is a big enough chunk of audio since last run
#         bufferLengthSec = self.wavAudioBuffer.getnframes() / float(self.framerate)
#         if (bufferLengthSec - self.prevBufferSec) < self.modelRunBufferDiffThresh:
#             return
        
#         # Ready audioBuffer for reading
#         self.wavAudioBuffer.close()
#         self.audioBuffer.seek(0)

#         # Run model and generate series of words and their timestamps
#         segments, _ = self.model.transcribe(self.audioBuffer, initial_prompt=self.prevFinalText, word_timestamps=True)
#         words = []
#         ends = []
#         for segment in segments:
#             for w in segment.words:
#                 words.append(w.word)
#                 ends.append(w.end)


#         # Extract finalized transcription
#         finalized = ""
#         finalizedEndTime = 0
#         finalizedEndIndex = 0

#         # Force a run of audio to be finalized if buffer reaches max size
#         if bufferLengthSec > self.maxBufferLength:
#             # Add words until we reach the target amount of buffer to flush
#             for i in range(len(words)):
#                 finalized += words[i]
#                 finalizedEndTime = max(finalizedEndTime, ends[i])
                
#                 if (finalizedEndTime > self.modelRunBufferDiffThresh):
#                     self.prevFinalText = finalized
#                     await self.onFinalTranscript(finalized, start=self.prevFinalTime + finalizedEndTime, end=self.prevFinalTime + ends[i])

#                     finalizedEndTime = max(finalizedEndTime, ends[i])
#                     finalizedEndIndex = i + 1
#                     break

#             # If threshold still not met, buffer must just contain silence, just purge it
#             if (finalizedEndTime < self.modelRunBufferDiffThresh):
#                 finalizedEndTime = self.modelRunBufferDiffThresh


#         for i in range(finalizedEndIndex, min(localAgreeLen(self.prevWords), len(words))):
#             # Stop once local agreement fails
#             if not localAgree(self.prevWords, i, words[i]):
#                 break
        
#             finalized += words[i]
#             # Finalize transcription once sentence end is reached
#             if words[i].endswith(sentenceEnds) and not words[i].endswith(sentenceEndsWhitelist):
#                 self.prevFinalText = finalized
#                 await self.onFinalTranscript(finalized, start=self.prevFinalTime + finalizedEndTime, end=self.prevFinalTime + ends[i])

#                 finalized = ""
#                 finalizedEndTime = max(finalizedEndTime, ends[i])
#                 finalizedEndIndex = i + 1


#         # Extract rest of the text to use as in progress transcription
#         inprogress = ""
#         for i in range(finalizedEndIndex, len(words)):
#             inprogress += words[i]

#         if inprogress != "":
#             await self.onInProgressTranscript(inprogress, start=self.prevFinalTime + finalizedEndTime, end=self.prevFinalTime + ends[-1])

#         self.prevFinalTime += finalizedEndTime
#         self.prevWords.append(words[finalizedEndIndex:])
#         if len(self.prevWords) > self.localAgreeDim - 1:
#             self.prevWords.pop(0)

#         # Trim finalized audio from audio buffer
#         trimedAudioBuffer = io.BytesIO()
#         wavTrimedAudioBuffer = wave.open(trimedAudioBuffer, 'wb')
#         wavTrimedAudioBuffer.setframerate(self.framerate)
#         wavTrimedAudioBuffer.setnchannels(self.nchannels)
#         wavTrimedAudioBuffer.setsampwidth(self.sampwidth)

#         self.audioBuffer.seek(0)
#         with wave.open(self.audioBuffer, 'rb') as wavAudioBuffer:
#             numframes = wavAudioBuffer.getnframes()
#             framestart = min(numframes, int(self.framerate * finalizedEndTime))

#             wavAudioBuffer.setpos(framestart)
#             frames = wavAudioBuffer.readframes(numframes - framestart)
#             wavTrimedAudioBuffer.writeframes(frames)
        
#         self.audioBuffer = trimedAudioBuffer
#         self.wavAudioBuffer = wavTrimedAudioBuffer

#         self.prevBufferSec = self.wavAudioBuffer.getnframes() / float(self.framerate)


#     def unloadModel(self):
#         if self.model and self.model.model.model_is_loaded:
#             self.model.model.unload_model()
