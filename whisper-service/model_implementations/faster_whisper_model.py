'''
Implementation of TranscriptionModelBase using faster_whisper

Classes:
    FasterWhisperModel
'''
from faster_whisper import WhisperModel
from model_bases.local_agree_model_base import LocalAgreeModelBase, TranscriptionSegment


class FasterWhisperModel(LocalAgreeModelBase):
    '''
    Implementation of TranscriptionModelBase using faster whisper and local agreement.
    '''
    __slots__ = ['model']

    def __init__(self, ws, config):
        '''
        Called when a websocket requests a transcription model.

        Parameters:
        ws  (WebSocket)                  : FastAPI websocket that requested the model
        config (TranscriptionModelConfig): Custom JSON object containing configuration for model 
                                           Defined by implementation
        '''
        super().__init__(ws, config)
        self.model = None

    @staticmethod
    def validate_config(config):
        '''
        Should check if loaded JSON config is valid. Called model is instantiated.
        Throw an error if provided config is not valid
        Remember to call valididate_config for any model_bases to ensure configuration 
        for model_bases is checked as well. 
        e.g. if you use LocalAgreeModelBase: config = LocalAgreeModelBase.validate(config)

        Parameters:
        config (dict): Parsed JSON config from server device_config.json. Guaranteed to be a dict.

        Returns:
        config (TranscriptionModelConfig): Validated config object
        '''
        config = LocalAgreeModelBase.validate_config(config)
        return config

    def load_model(self):
        '''
        Loads model into memory to be ready for transcription.
        Called when websocket connects.
        '''
        self.model = WhisperModel(
            self.config['model'],
            device=self.config['device']
        )

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
