'''
A utility class for buffering numpy arrays

Classes:
    NPCircularBuffer
'''
import numpy as np
import numpy.typing as npt


class NPCircularBuffer:
    '''
    An implementation of a fixed length circular buffer numpy array.
    '''
    __slots__ = ['dtype', 'max_size', 'array', 'end']

    def __init__(self, max_size: int, dtype: npt.DTypeLike = 'int'):
        '''
        Parameters:
        max_size    (int)        : Maximum number of elements circular buffer should hold
        dtype       (numpy dtype): Data type of elements to place in buffer
        '''
        self.dtype = dtype
        self.max_size = max_size

        self.array = np.empty((max_size), dtype=self.dtype)
        self.end = 0

    def append_sequence(self, sequence: npt.NDArray) -> npt.NDArray:
        '''
        Append a sequence to the end of the circular buffer.
        Attempts to append as many elements as possible, returns elements that were not appended.

        Parameters:
        sequence    (numpy array): Numpy array to append to buffer

        Returns:
        Numpy array containing elements that were not appended in the same order as provided.
        '''
        len_to_copy = min(self.max_size - self.end, len(sequence))
        self.array[self.end:self.end + len_to_copy] = sequence[:len_to_copy]
        self.end += len_to_copy

        return sequence[len_to_copy:]

    def get_curr_buffer(self) -> npt.NDArray:
        '''
        Returns:
        A numpy view of the current elements in buffer
        '''
        return self.array[:self.end]

    def shift_buffer(self, shift: int) -> None:
        '''
        Shifts buffer by a given number of elements.
        Oldest elements are shifted out first.

        Parameters:
        shift   (int): Number of elements to shift oit.
        '''
        assert isinstance(shift, int), "Shift must be an integer"
        assert shift >= 0, "Shift must be nonnegative"

        shift = min(self.end, shift)
        self.array = np.roll(self.array, -shift)
        self.end -= shift

    def __len__(self) -> int:
        '''
        Returns:
        Length of current buffer
        '''
        return self.end
