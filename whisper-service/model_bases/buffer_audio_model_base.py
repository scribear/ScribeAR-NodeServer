'''
Provides a helper class for implementing Transcription Models

Classes:
    BufferAudioModelBase
'''
import numpy as np
import numpy.typing as npt
from utils.np_circular_buffer import NPCircularBuffer
from utils.decode_wav import decode_wav
from model_bases.transcription_model_base import TranscriptionModelBase


class BufferAudioModelBase(TranscriptionModelBase):
    '''
    A partial TranscriptionModelBase implementation that handles buffering audio chunks 
    into larger segments.

    Audio chunks that are passed to queue_audio_chunk() are buffered until larger chunks 
    before process_segment() is called.

    Implements the queue_audio_chunk() method. The load_model(), unload_model(), 
    and process_segment() methods must be implemented.
    '''
    __slots__ = ['max_segment_samples', 'min_new_samples',
                 'num_last_processed_samples', 'num_purged_samples', 'buffer']
    SAMPLE_RATE = 16_000

    def __init__(
        self,
        ws,
        max_segment_samples=SAMPLE_RATE * 30,
        min_new_samples=SAMPLE_RATE
    ):
        '''
        Parameters:
        ws                  (WebSocket): FastAPI websocket that requested the model
        max_segment_samples (int)      : Maximum number of samples to be passed to process_segment()
        min_new_samples     (int)      : Minimum number of fresh samples in buffer before 
                                         process_segment() should be called
        '''
        super().__init__(ws)
        self.max_segment_samples = max_segment_samples
        self.min_new_samples = min_new_samples

        self.num_last_processed_samples = 0
        self.num_purged_samples = 0
        self.buffer = NPCircularBuffer(
            self.max_segment_samples,
            dtype=np.float16
        )

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

    async def process_segment(
        self,
        audio_segment: npt.NDArray,
        audio_segment_start_time: float
    ) -> int:
        '''
        Called when an audio segment is ready to be transcribed.
        To implement this function, the audio_segment should be transcribed 
        and on_final_transcript_block() or on_in_progress_transcript_block().

        Note: Once audio_segment contains max_segment_samples, process_segment 
            must return a nonzero value. Otherwise, the buffer never shrinks 
            and process_segment could be called in an infinite loop

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
        raise NotImplementedError('Must implement per model')

    async def queue_audio_chunk(self, audio_chunk) -> None:
        '''
        Called when an audio chunk is received.

        Buffers audio_chunks until there are at least min_new_samples more audio samples 
        in the buffer compared previous call of process_segment() before calling
        process_segment() again to transcribe audio. Purges the designated number of samples
        from buffer based on return value of process_segment.

        Parameters:
        audio_chunk   (io.BytesIO): A buffer containing wav audio
        '''
        audio = decode_wav(audio_chunk)
        extra_audio = self.buffer.append_sequence(audio)

        # If buffer is full, process segments until entire audio chunk can be
        # inserted into buffer
        while len(extra_audio) > 0:
            samples_to_purge = await self.process_segment(
                self.buffer.get_curr_buffer().copy(),
                self.num_purged_samples / self.SAMPLE_RATE
            )

            self.buffer.shift_buffer(samples_to_purge)
            self.num_purged_samples += samples_to_purge
            self.num_last_processed_samples = len(self.buffer)

            extra_audio = self.buffer.append_sequence(extra_audio)

        # Once there are enough new samples, process segments once
        if (len(self.buffer) - self.num_last_processed_samples) > self.min_new_samples:
            samples_to_purge = await self.process_segment(
                self.buffer.get_curr_buffer(),
                self.num_purged_samples / self.SAMPLE_RATE
            )

            self.buffer.shift_buffer(samples_to_purge)
            self.num_purged_samples += samples_to_purge
            self.num_last_processed_samples = len(self.buffer)
