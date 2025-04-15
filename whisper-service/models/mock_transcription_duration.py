'''
Mock implementation of TranscriptionModelBase that returns duration of received audio chunks.

Classes:
    MockTranscribeDuration
'''
import wave
from model_bases.transcription_model_base import TranscriptionModelBase

class MockTranscribeDuration(TranscriptionModelBase):
    '''
    Dummy TranscriptionModelBase implementation that returns the 
    duration of recieved audio as "transcription"
    '''
    time = 0

    def load_model(self):
        '''
        Loads model into memory to be ready for transcription.
        Called when websocket connects.
        '''

    def unload_model(self):
        '''
        Unloads model from memory and cleans up.
        Called when websocket disconnects.
        '''

    async def queue_audio_chunk(self, audio_chunk):
        '''
        Called when an audio chunk is received.

        Generates final transcription blocks containing duration of audio received.

        Parameters:
        audio_chunk   (io.BytesIO): A buffer containing wav audio
        '''
        infofile = wave.open(audio_chunk, 'r')
        frames = infofile.getnframes()
        rate = infofile.getframerate()

        duration = frames / float(rate)

        start = self.time
        self.time += duration

        await self.on_final_transcript_block(
            f'Received {duration} seconds of audio.',
            start,
            self.time
        )
