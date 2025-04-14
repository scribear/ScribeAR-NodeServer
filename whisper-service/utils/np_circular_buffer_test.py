import numpy as np
from np_circular_buffer import NPCircularBuffer


def test_single_element_append():
    buffer = NPCircularBuffer(2)

    assert np.array_equal(
        buffer.appendSequence(np.array([1])),
        np.array([])
    ), "All elements inserted"
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([1])
    ), "Correct sequence in buffer"

    assert np.array_equal(
        buffer.appendSequence(np.array([2])),
        np.array([])
    ), "All elements inserted"
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([1, 2])
    ), "Correct sequence in buffer"

    assert np.array_equal(
        buffer.appendSequence(np.array([3])),
        np.array([3])
    ), "All elements inserted"
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([1, 2])
    ), "Correct sequence in buffer"


def test_multi_element_append():
    buffer = NPCircularBuffer(7)

    assert np.array_equal(
        buffer.appendSequence(np.array([1, 2, 3])),
        np.array([])
    ), "All elements inserted"
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([1, 2, 3])
    ), "Correct sequence in buffer"

    assert np.array_equal(
        buffer.appendSequence(np.array([4, 5, 6])),
        np.array([])
    ), "All elements inserted"
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([1, 2, 3, 4, 5, 6])
    ), "Correct sequence in buffer"

    assert np.array_equal(
        buffer.appendSequence(np.array([7, 8, 9])),
        np.array([8, 9])
    ), "All elements inserted"
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([1, 2, 3, 4, 5, 6, 7])
    ), "Correct sequence in buffer"


def test_shift_buffer():
    buffer = NPCircularBuffer(10)

    buffer.appendSequence(np.array([1, 2, 3, 4, 5, 6, 7, 8, 9]))
    buffer.shiftBuffer(1)
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([2, 3, 4, 5, 6, 7, 8, 9])
    ), "Correct sequence in buffer"

    buffer.shiftBuffer(5)
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([7, 8, 9])
    ), "Correct sequence in buffer"

    buffer.shiftBuffer(5)
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([])
    ), "Correct sequence in buffer"


def test_shift_and_append():
    buffer = NPCircularBuffer(10)

    buffer.appendSequence(np.array([1, 2, 3, 4, 5]))
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([1, 2, 3, 4, 5])
    ), "Correct sequence in buffer"

    buffer.shiftBuffer(3)
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([4, 5])
    ), "Correct sequence in buffer"

    buffer.appendSequence(np.array([6, 7, 8, 9, 10, 11, 12]))
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([4, 5, 6, 7, 8, 9, 10, 11, 12])
    ), "Correct sequence in buffer"

    buffer.shiftBuffer(5)
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([9, 10, 11, 12])
    ), "Correct sequence in buffer"

    buffer.appendSequence(np.array([13, 14, 15, 16, 17, 18, 19, 20]))
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([9, 10, 11, 12, 13, 14, 15, 16, 17, 18])
    ), "Correct sequence in buffer"

    buffer.shiftBuffer(15)
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([])
    ), "Correct sequence in buffer"

    buffer.appendSequence(np.array([21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]))
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([21, 22, 23, 24, 25, 26, 27, 28, 29, 30])
    ), "Correct sequence in buffer"

    buffer.shiftBuffer(10)
    assert np.array_equal(
        buffer.getCurrBuffer(),
        np.array([])
    ), "Correct sequence in buffer"