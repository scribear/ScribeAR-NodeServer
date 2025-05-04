'''
Provides a helper class for implementing Transcription Models

Classes:
    TranscriptionSegment
    LocalAgreeModelBase
'''
from abc import abstractmethod
import math
import numpy.typing as npt
from model_bases.buffer_audio_model_base import BufferAudioModelBase
from utils.config_dict_contains import config_dict_contains_int


class TranscriptionSegment:
    '''
    Class for holding transcription chunks.
    '''
    __slots__ = ['text', 'start', 'end']

    def __init__(self, text: str, start: float, end: float):
        '''
        Parameters:
        text    (str)  : Transcribed text for chunk.
        start   (float): Start time of current transcription. (relative to first block)
        end     (float): End time of current transcription.
        '''
        self.text = text
        self.start = start
        self.end = end

    def __repr__(self) -> str:
        '''
        Returns:
        String representation of TranscriptionSegment
        '''
        return f'[{self.start:6.2f} - {self.end:6.2f}] {self.text}'

    def __str__(self) -> str:
        '''
        Returns:
        String representation of TranscriptionSegment
        '''
        return f'[{self.start:6.2f} - {self.end:6.2f}] {self.text}'


class LocalAgreeModelBase(BufferAudioModelBase):
    '''
    A partial BufferAudioModelBase implementation that handles local agreement 
    (Liu et al., 2020) (Macháček et al., 2023)

    If the last n transcriptions have matching prefix ending in sentence end punctuation,
    that prefix is emitted as a finalized transcription. The audio samples corresponding 
    to that transcription is then purged from the buffer. Any remaining transcription text 
    is emitted as an in_progress transcription.

    Implements the process_segment() method.
    The load_model(), unload_model(), and transcribe_audio() methods need to be implemented.

    @misc{liu2020lowlatencysequencetosequencespeechrecognition,
      title={Low-Latency Sequence-to-Sequence Speech Recognition 
             and Translation by Partial Hypothesis Selection}, 
      author={Danni Liu and Gerasimos Spanakis and Jan Niehues},
      year={2020},
      eprint={2005.11185},
      archivePrefix={arXiv},
      primaryClass={cs.CL},
      url={https://arxiv.org/abs/2005.11185}, 
    }
    @misc{macháček2023turningwhisperrealtimetranscription,
      title={Turning Whisper into Real-Time Transcription System}, 
      author={Dominik Macháček and Raj Dabre and Ondřej Bojar},
      year={2023},
      eprint={2307.14743},
      archivePrefix={arXiv},
      primaryClass={cs.CL},
      url={https://arxiv.org/abs/2307.14743}, 
    }
    '''
    __slots__ = ['prev_text', 'local_agree_dim', 'prev_transcriptions']

    SENTENCE_ENDS = ('.', '?', '!')
    SENTENCE_ENDS_WHITELIST = '...'

    def __init__(self, ws, *args, local_agree_dim=2, **kwargs):
        '''
        Called when a websocket requests a transcription model.

        Parameters:
        ws               (WebSocket): FastAPI websocket that requested the model.
        local_agree_dim (int)       : Number of dimensions to run local agreement on.
        *args, **kwargs             : Args passed to BufferAudioModelBase
        '''
        super().__init__(ws, *args, **kwargs)

        self.prev_text = ''
        self.local_agree_dim = local_agree_dim
        self.prev_transcriptions: list[list[TranscriptionSegment]] = []

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
        config_dict_contains_int(config, 'local_agree_dim', minimum=1)
        return config

    def load_model(self) -> None:
        '''
        Should load model into memory to be ready for transcription.
        Called when websocket connects.
        '''
        raise NotImplementedError('Must implement per model')

    def unload_model(self) -> None:
        '''
        Should unload model from memory and cleanup.
        Called when websocket disconnects.
        '''
        raise NotImplementedError('Must implement per model')

    @abstractmethod
    async def transcribe_audio(
        self,
        audio_segment: npt.NDArray,
        prev_text: str
    ) -> list[TranscriptionSegment]:
        '''
        Transcribe audio into TranscriptionSegments containing text, start, and end times

        Parameters:
        audio_segment   (1D numpy array):
            Contains float16 audio normalized to [-1, 1] at 16k sample rate.

        prev_text       (str):
            The previously finalized text that occurred before the current audio_segment. 
            Used to precondition model for accuracy.

        Returns:
        A list of TranscriptionSegments
        '''
        raise NotImplementedError('Must implement per model')

    async def process_segment(self, audio_segment, audio_segment_start_time):
        '''
        Called when an audio segment is ready to be transcribed.

        Implements local agreement described in referenced papers.
        Calls transcribe_audio() to get TranscriptionSegments from audio segments.

        Parameters:
        audio_segment       (1D numpy array): 
            Contains float16 audio normalized to [-1, 1] at 16k sample rate.
            It contains at least min_new_segment new samples since previous call of process_segment.
            It also contains at most max_segment_samples samples.

        audio_segment_start_time     (float):
            The timestamp of the start of the provided audio_segment calculated using the cumulative 
            return value of process_segment

        Returns:
        Number samples of audio to purge from audio buffer. This value is also used to compute the
        start time provided to process_segment.
        '''

        max_segment_length_reached = len(
            audio_segment) >= self.max_segment_samples

        segments = await self.transcribe_audio(audio_segment, self.prev_text)

        # Extract segments that satisfy local agreement
        final_text = ''
        final_end_idx = 0
        final_end_time = 0
        for i in range(min(len(segments), self.max_local_agree_length())):
            if not self.local_agree(segments[i], i):
                break
            final_text += segments[i].text

            if (
                final_text.endswith(self.SENTENCE_ENDS) and
                not final_text.endswith(self.SENTENCE_ENDS_WHITELIST)
            ):
                start = final_end_time
                final_end_time = max(final_end_time, segments[i].end)

                self.prev_text = final_text
                await self.on_final_transcript_block(
                    final_text,
                    audio_segment_start_time + start,
                    audio_segment_start_time + final_end_time
                )
                final_end_idx = i + 1
                final_text = ''

        # If max segment length has been reached, force finalization of some text
        if max_segment_length_reached:
            start = final_end_time
            forced_final_text = ''
            while (
                final_end_idx < len(segments) and
                final_end_time < self.min_new_samples / self.SAMPLE_RATE
            ):
                forced_final_text += segments[final_end_idx].text

                final_end_time = max(
                    final_end_time,
                    segments[final_end_idx].end
                )
                final_end_idx += 1
                self.prev_text = forced_final_text

            await self.on_final_transcript_block(
                forced_final_text,
                audio_segment_start_time + start,
                audio_segment_start_time + final_end_time
            )

        # Output remaining text as in progress transcription
        in_progress = ''
        in_progress_end_time = final_end_time
        for i in range(final_end_idx, len(segments)):
            in_progress += segments[i].text
            in_progress_end_time = max(in_progress_end_time, segments[i].end)
        await self.on_in_progress_transcript_block(
            in_progress,
            audio_segment_start_time + final_end_time,
            audio_segment_start_time + in_progress_end_time
        )

        # Update transcription history
        self.prev_transcriptions.append(segments)
        if len(self.prev_transcriptions) >= self.local_agree_dim:
            self.prev_transcriptions.pop(0)

        finalized_samples = int(final_end_time * self.SAMPLE_RATE)
        if max_segment_length_reached:
            # Ensure at least at least the minimum number of samples is purged in case of silence
            # where no forced finalized text would be emitted.
            finalized_samples = max(self.min_new_samples, finalized_samples)
        return min(finalized_samples, len(audio_segment))

    def local_agree(self, segment: TranscriptionSegment, index: int) -> bool:
        '''
        Checks if segment at given index is in local agreement with transcription history.

        Parameters:
        segment (TranscriptionSegment): New TranscriptionSegment to compare with history.
        index   (int)                 : Position TranscriptSegment corresponds to in history.

        Returns:
        True if in local agreement, False otherwise
        '''
        # Reject if there is not enough history to form required agreement
        if len(self.prev_transcriptions) != self.local_agree_dim - 1:
            return False

        # Reject if any transcription doesn't match
        for transcription in self.prev_transcriptions:
            if segment.text != transcription[index].text:
                return False

        return True

    def max_local_agree_length(self) -> int:
        '''
        Returns:
        The shortest transcription history sequence. This is also the maximum number of
        transcription segments that could possibly agree in required dimensions.
        '''
        if len(self.prev_transcriptions) == 0:
            return math.inf
        return min(len(transcription) for transcription in self.prev_transcriptions)
