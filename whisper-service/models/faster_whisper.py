from faster_whisper import WhisperModel
from model_bases.whisper_model_base import WhisperModelBase
from model_bases.local_agree_model_base import LocalAgreeModelBase, TranscriptionSegment
from fastapi import WebSocket


class FasterWhisper(LocalAgreeModelBase):
    '''
    Implementation of WhisperModel using faster whisper and local agreement.
    '''

    def __init__(self, ws: WebSocket, modelSize: str, device='auto', *args, **kwargs):
        super().__init__(ws, *args, **kwargs)
        self.modelSize = modelSize
        self.device = device

    def loadModel(self):
        self.model = WhisperModel(self.modelSize, device=self.device)

    async def transcribeAudio(self, audioSegment, prevText):
        transcription, _ = self.model.transcribe(
            audioSegment,
            initial_prompt=prevText,
            word_timestamps=True
        )

        segments = []
        for part in transcription:
            for word in part.words:
                segments.append(
                    TranscriptionSegment(word.word, word.start, word.end)
                )
        return segments

    def unloadModel(self):
        if self.model and self.model.model.model_is_loaded:
            self.model.model.unload_model()
