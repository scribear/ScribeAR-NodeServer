import numpy as np
import numpy.typing as npt


class NPCircularBuffer:
    '''
    An implementation of a *fixed* length circular buffer numpy array
    '''
    __slots__ = ['dtype', 'maxSize', 'array', 'end']

    def __init__(self, maxSize: int, dtype: npt.DTypeLike = 'int'):
        self.dtype = dtype
        self.maxSize = maxSize

        self.array = np.empty((maxSize), dtype=self.dtype)
        self.end = 0

    def appendSequence(self, sequence: npt.NDArray):
        '''
        Append a sequence to the end of the circular buffer
        Attempts to append as many elements as possible, returns elements that were not appended
        '''
        assert (self.dtype == sequence.dtype)
        assert (len(sequence.shape) == 1)

        lenToCopy = min(self.maxSize - self.end, len(sequence))
        self.array[self.end:self.end + lenToCopy] = sequence[:lenToCopy]
        self.end += lenToCopy

        return sequence[lenToCopy:]

    def getCurrBuffer(self) -> npt.NDArray:
        '''
        Returns a view of the current elements in buffer
        '''
        return self.array[:self.end]

    def shiftBuffer(self, shift: int):
        '''
        Shifts buffer by a given number of elements
        '''
        assert (self.end >= shift)
        self.array = np.roll(self.array, -shift)
        self.end -= shift

    def __len__(self):
        '''
        Have len() function return length of current buffer
        '''
        return self.end
