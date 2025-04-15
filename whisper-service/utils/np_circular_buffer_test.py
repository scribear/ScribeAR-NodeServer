'''
Unit tests for NPCircularBuffer class
'''
import numpy as np
from utils.np_circular_buffer import NPCircularBuffer


def test_single_element_append():
    '''
    Tests appending one elements at a time to buffer
    '''
    buffer = NPCircularBuffer(2)

    assert np.array_equal(
        buffer.append_sequence(np.array([1])),
        np.array([])
    ), "All elements inserted"
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([1])
    ), "Correct sequence in buffer"

    assert np.array_equal(
        buffer.append_sequence(np.array([2])),
        np.array([])
    ), "All elements inserted"
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([1, 2])
    ), "Correct sequence in buffer"

    assert np.array_equal(
        buffer.append_sequence(np.array([3])),
        np.array([3])
    ), "All elements inserted"
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([1, 2])
    ), "Correct sequence in buffer"


def test_multi_element_append():
    '''
    Tests appending multiple elements at a time to buffer
    '''
    buffer = NPCircularBuffer(7)

    assert np.array_equal(
        buffer.append_sequence(np.array([1, 2, 3])),
        np.array([])
    ), "All elements inserted"
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([1, 2, 3])
    ), "Correct sequence in buffer"

    assert np.array_equal(
        buffer.append_sequence(np.array([4, 5, 6])),
        np.array([])
    ), "All elements inserted"
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([1, 2, 3, 4, 5, 6])
    ), "Correct sequence in buffer"

    assert np.array_equal(
        buffer.append_sequence(np.array([7, 8, 9])),
        np.array([8, 9])
    ), "All elements inserted"
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([1, 2, 3, 4, 5, 6, 7])
    ), "Correct sequence in buffer"


def test_shift_buffer():
    '''
    Tests shifting out elements from the buffer
    '''
    buffer = NPCircularBuffer(10)

    buffer.append_sequence(np.array([1, 2, 3, 4, 5, 6, 7, 8, 9]))
    buffer.shift_buffer(1)
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([2, 3, 4, 5, 6, 7, 8, 9])
    ), "Correct sequence in buffer"

    buffer.shift_buffer(5)
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([7, 8, 9])
    ), "Correct sequence in buffer"

    buffer.shift_buffer(5)
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([])
    ), "Correct sequence in buffer"


def test_len():
    '''
    Tests that buffer returns correct length
    '''
    buffer = NPCircularBuffer(5)

    assert len(buffer) == 0, "Reports correct length"

    buffer.append_sequence(np.array([1, 2]))
    assert len(buffer) == 2, "Reports correct length"

    buffer.append_sequence(np.array([3, 4, 5]))
    assert len(buffer) == 5, "Reports correct length"

    buffer.append_sequence(np.array([6, 7]))
    assert len(buffer) == 5, "Reports correct length"

    buffer.shift_buffer(3)
    assert len(buffer) == 2, "Reports correct length"


def test_shift_and_append():
    '''
    Test combinations of shifts and appends to buffer
    '''
    buffer = NPCircularBuffer(10)

    buffer.append_sequence(np.array([1, 2, 3, 4, 5]))
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([1, 2, 3, 4, 5])
    ), "Correct sequence in buffer"

    buffer.shift_buffer(3)
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([4, 5])
    ), "Correct sequence in buffer"

    buffer.append_sequence(np.array([6, 7, 8, 9, 10, 11, 12]))
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([4, 5, 6, 7, 8, 9, 10, 11, 12])
    ), "Correct sequence in buffer"

    buffer.shift_buffer(5)
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([9, 10, 11, 12])
    ), "Correct sequence in buffer"

    buffer.append_sequence(np.array([13, 14, 15, 16, 17, 18, 19, 20]))
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([9, 10, 11, 12, 13, 14, 15, 16, 17, 18])
    ), "Correct sequence in buffer"

    buffer.shift_buffer(15)
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([])
    ), "Correct sequence in buffer"

    buffer.append_sequence(
        np.array([21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]))
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([21, 22, 23, 24, 25, 26, 27, 28, 29, 30])
    ), "Correct sequence in buffer"

    buffer.shift_buffer(10)
    assert np.array_equal(
        buffer.get_curr_buffer(),
        np.array([])
    ), "Correct sequence in buffer"
