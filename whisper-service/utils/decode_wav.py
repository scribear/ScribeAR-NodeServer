'''
A utility function to help convert wav audio bytes to numpy array

Functions:
    decode_wav
'''
import io
import wave
import numpy as np
import numpy.typing as npt


def decode_wav(wav_buffer: io.BytesIO) -> npt.NDArray:
    '''
    Decode a buffer containing wav data into numpy array for use with whisper.
    Note: This function doesn't do any reencoding.

    Parameters:
    wav_buffer  (io.BytesIO): Wav audio buffer in the following format:
        sample width : 2 bytes
        sample rate  : 16 khz
        num channels : 1
    
    Returns:
    1D numpy array containing float16 data normalized to [-1, 1].
    Array represents audio in single channel with 16_000 samples per second.
    '''
    with wave.open(wav_buffer, 'rb') as wav_audio:
        assert wav_audio.getsampwidth() == 2
        assert wav_audio.getframerate() == 16_000
        assert wav_audio.getnchannels() == 1

        # Extract pcm audio data from wav
        nframes = wav_audio.getnframes()
        frames = wav_audio.readframes(nframes)
        audio = np.frombuffer(frames, dtype=np.int16)

        # Normalize audio to between -1 and 1
        audio = audio.astype(np.float16) / abs(np.iinfo(np.int16).min)
    return audio
