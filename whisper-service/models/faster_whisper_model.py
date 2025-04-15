'''
Implementation of TranscriptionModelBase using faster_whisper

Classes:
    FasterWhisperModel
'''
from fastapi import WebSocket
from faster_whisper import WhisperModel
from model_bases.local_agree_model_base import LocalAgreeModelBase, TranscriptionSegment


class FasterWhisperModel(LocalAgreeModelBase):
    '''
    Implementation of TranscriptionModelBase using faster whisper and local agreement.
    '''
    __slots__ = ['model_size', 'device', 'model']

    def __init__(self, ws: WebSocket, model_size: str, *args, device='auto',  **kwargs):
        '''
        Parameters:
        ws               (WebSocket): FastAPI websocket that requested the model.
        model_size             (str): faster_whisper model to run
        *args, **kwargs             : Args passed to LocalAgreeModelBase
        '''
        super().__init__(ws, *args, **kwargs)
        self.model_size = model_size
        self.device = device
        self.model = None

    def load_model(self):
        '''
        Loads model into memory to be ready for transcription.
        Called when websocket connects.
        '''
        self.model = WhisperModel(self.model_size, device=self.device)

    def unload_model(self):
        '''
        Unloads model from memory and cleans up.
        Called when websocket disconnects.
        '''
        if self.model and self.model.model.model_is_loaded:
            self.model.model.unload_model()

    async def transcribe_audio(self, audio_segment, prev_text):
        '''
        Transcribes audio into TranscriptionSegments containing text, start, and end times

        Parameters:
        audio_segment   (1D numpy array):
            Contains float16 audio normalized to [-1, 1] at 16k sample rate.

        prev_text       (str):
            The previously finalized text that occurred before the current audio_segment. 
            Used to precondition model for accuracy.

        Returns:
        A list of TranscriptionSegments
        '''
        transcription, _ = self.model.transcribe(
            audio_segment,
            initial_prompt=prev_text,
            word_timestamps=True
        )

        segments = []
        for part in transcription:
            for word in part.words:
                segments.append(
                    TranscriptionSegment(word.word, word.start, word.end)
                )
        return segments
