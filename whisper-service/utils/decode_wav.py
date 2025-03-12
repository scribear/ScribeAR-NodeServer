import io
import wave
import numpy as np
import numpy.typing as npt


def decodeWav(wavBuffer: io.BytesIO) -> npt.NDArray:
    '''
    Decode a buffer containing wav data into numpy array for use with whisper
    Note: This function doesn't do any reencoding
    Wav data should be in the following format:
        sample width : 2 bytes
        sample rate  : 16 khz
        num channels : 1
    '''
    with wave.open(wavBuffer, 'rb') as wavAudio:
        assert (wavAudio.getsampwidth() == 2)
        assert (wavAudio.getframerate() == 16_000)
        assert (wavAudio.getnchannels() == 1)

        # Extract pcm audio data from wav
        nframes = wavAudio.getnframes()
        frames = wavAudio.readframes(nframes)
        audio = np.frombuffer(frames, dtype=np.int16)

        # Normalize audio to between -1 and 1
        audio = audio.astype(np.float16) / abs(np.iinfo(np.int16).min)
    return audio
