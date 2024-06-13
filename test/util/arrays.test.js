import {
  range,
  shuffle,
  swap,
  swapAllInArr,
  isMatrix,
  isSquareMatrix,
  validateMatrixOrThrow,
  validateSquareMatrixOrThrow,
  rotateArr90,
  reflectOverHorizontal,
  reflectOverVertical,
  reflectOverDiagonal,
  reflectOverAntiDiagonal
} from '../../index.js';

const when = (msg, testFuncs) => {
  describe(`when ${msg}`, testFuncs);
}

const fail = (message = 'test nyi') => {
  throw new Error(message)
};

function whenArrayIsNullExpectToThrow(func, args = []) {
  when('array is null', () => {
    test('throws', () => {
      expect(() => func(null, ...args)).toThrow();
    });
  });
}

describe('array utilities', () => {
  describe('range', () => {
    when('start is omitted', () => {
      test('creates an array starting at 0', () => {
        expect(range(5)).toEqual([0, 1, 2, 3, 4]);
      });
    });

    when('start is included', () => {
      test('creates an array from start to end', () => {
        expect(range(5, 0)).toEqual([0, 1, 2, 3, 4]);
        expect(range(5, 2)).toEqual([2, 3, 4]);
      });
    });
  });

  describe('shuffle', () => {
    whenArrayIsNullExpectToThrow(shuffle);

    when('array is empty', () => {
      test('returns the empty array', () => {
        expect(shuffle([])).toEqual([]);
      });
    });

    when('array is non-empty', () => {
      test('returns a shuffled version of the array', () => {
        const originalArr = range(
          Math.floor(Math.random() * 100) + 100,
          Math.floor(Math.random() * 100)
        );
        const arr = shuffle([...originalArr]);
        expect(arr).not.toEqual(originalArr);
        expect(arr).toHaveLength(originalArr.length);
        expect(arr).toEqual(expect.arrayContaining(originalArr));
      });
    });
  });

  describe('swap', () => {
    whenArrayIsNullExpectToThrow(swap, [0, 1]);

    when('i or j is out of bounds', () => {
      test('throws', () => {
        const arr = [1, 2, 3];
        expect(() => swap(arr, -(arr.length+1), 0)).toThrow();
        expect(() => swap(arr, 0, -(arr.length+1))).toThrow();
        expect(() => swap(arr, -arr.length, 0)).toThrow();
        expect(() => swap(arr, 0, -arr.length)).toThrow();
        expect(() => swap(arr, arr.length, 0)).toThrow();
        expect(() => swap(arr, 0, arr.length)).toThrow();
        expect(() => swap(arr, arr.length+1, 0)).toThrow();
        expect(() => swap(arr, 0, arr.length+1)).toThrow();
      });
    });

    when('i and j are within bounds', () => {
      when('i and j are equal', () => {
        test('does nothing', () => {
          const arr = [1, 2, 3];
          swap(arr, 1, 1);
          expect(arr).toEqual([1, 2, 3]);
        });
      });

      when('i and j are not equal', () => {
        test('swaps the values at i and j', () => {
          const arr = [1, 2, 3];
          swap(arr, 0, 2);
          expect(arr).toEqual([3, 2, 1]);
          swap(arr, 2, 1);
          expect(arr).toEqual([3, 1, 2]);
        });
      });
    });
  });

  describe('swapAllInArr', () => {
    whenArrayIsNullExpectToThrow(swapAllInArr, [1, 2]);

    when('a and b are equal', () => {
      test('does nothing', () => {
        const arr = [1, 2, 3];
        swapAllInArr(arr, 1, 1);
        expect(arr).toEqual([1, 2, 3]);
      });
    });

    when('a and b are not equal', () => {
      test('swaps all occurrences of a and b', () => {
        const arr = [1, 2, 3, 1, 2, 3];
        swapAllInArr(arr, 1, 2);
        expect(arr).toEqual([2, 1, 3, 2, 1, 3]);
      });
    });
  });

  function checkBadRowsThrows(func) {
    when('rows is not a number', () => test('throws', () => expect(() => func([1,2,3,4], '1')).toThrow()));
    when('rows is not an integer', () => test('throws', () => expect(() => func([1,2,3,4], 1.5)).toThrow()));
    when('rows is not positive', () => {
      test('throws', () => {
        expect(() => func([1,2,3,4], 0)).toThrow();
        expect(() => func([1,2,3,4], -1)).toThrow();
      });
    });
  }
  function checkBadRowsReturnsFalse(func) {
    when('rows is not a number', () => test('returns false', () => expect(func([1,2,3,4], '1')).toBe(false)));
    when('rows is not an integer', () => test('returns false', () => expect(func([1,2,3,4], 1.5)).toBe(false)));
    when('rows is not positive', () => {
      test('returns false', () => {
        expect(func([1,2,3,4], 0)).toBe(false);
        expect(func([1,2,3,4], -1)).toBe(false);
      });
    });
  }
  function checkBadArrThrows(func) {
    when('arr is null', () => test('throws', () => expect(() => func(null, 1)).toThrow()));
    when('arr is empty', () => test('throws', () => expect(() => func([], 1)).toThrow()));
  }
  function checkBadArrReturnsFalse(func) {
    when('arr is null', () => test(`returns false`, () => expect(func(null, 1)).toBe(false)));
    when('arr is empty', () => test(`returns false`, () => expect(func([], 1)).toBe(false)));
  }
  function checkNonSquareMatrixThrows(func) {
    when('arr length is not square', () => {
      test('throws', () => {
        const invalidSquareMatrixLengthValues = range(144, 2)
          .filter((length) => (!Number.isInteger(Math.sqrt(length))));

        invalidSquareMatrixLengthValues.forEach((length) => {
          expect(() => func(range(length))).toThrow();
        });
      });
    });
  }
  function checkInvalidRowsThrows(func) {

  }


  describe('isMatrix', () => {
    checkBadArrReturnsFalse(isMatrix);
    checkBadRowsReturnsFalse(isMatrix);

    when('arr is not a matrix', () => {
      test('returns false', () => {
        const arr = range(144);
        const invalidMatrixRowValues = range(arr.length + 1, 1).filter((rows) => ((arr.length % rows) !== 0));
        invalidMatrixRowValues.forEach((rows) => expect(isMatrix(arr, rows)).toBe(false));
      });
    });

    when('arr is a matrix', () => {
      test('returns true', () => {
        const arr = range(144);
        const validMatrixRowValues = range(arr.length + 1, 1).filter((rows) => ((arr.length % rows) === 0));
        validMatrixRowValues.forEach((rows) => expect(isMatrix(arr, rows)).toBe(true));
      });
    });
  });

  describe('isSquareMatrix', () => {
    checkBadArrReturnsFalse(isSquareMatrix);

    when('arr length is not square', () => {
      test('returns false', () => {
        const invalidSquareMatrixLengthValues = range(144, 2)
          .filter((length) => (!Number.isInteger(Math.sqrt(length))));

        invalidSquareMatrixLengthValues.forEach((length) => {
          expect(isSquareMatrix(range(length))).toBe(false);
        });
      });
    });

    when('arr length is square', () => {
      test('returns true', () => {
        const validSquareMatrixLengthValues = range(145, 1)
          .filter((length) => (Number.isInteger(Math.sqrt(length))));

        validSquareMatrixLengthValues.forEach((length) => {
          expect(isSquareMatrix(range(length))).toBe(true);
        });
      });
    });
  });

  describe('validateMatrixOrThrow', () => {
    checkBadArrThrows(validateMatrixOrThrow);
    checkBadRowsThrows(validateMatrixOrThrow);

    when('arr is not a matrix', () => {
      test('throws', () => {
        const arr = range(144);
        const invalidMatrixRowValues = range(arr.length + 1, 1).filter((rows) => ((arr.length % rows) !== 0));
        invalidMatrixRowValues.forEach((rows) => expect(() => validateMatrixOrThrow(arr, rows)).toThrow());
      });
    });

    when('arr is a matrix', () => {
      test('validates successfully, raises no error', () => {
        const arr = range(144);
        const validMatrixRowValues = range(arr.length + 1, 1).filter((rows) => ((arr.length % rows) === 0));
        validMatrixRowValues.forEach((rows) => expect(() => validateMatrixOrThrow(arr, rows)).not.toThrow());
      });
    });
  });

  describe('validateSquareMatrixOrThrow', () => {
    checkBadArrThrows(validateSquareMatrixOrThrow);
    checkNonSquareMatrixThrows(validateSquareMatrixOrThrow);

    when('arr length is square', () => {
      test('returns true', () => {
        const validSquareMatrixLengthValues = range(145, 1)
          .filter((length) => (Number.isInteger(Math.sqrt(length))));

        validSquareMatrixLengthValues.forEach((length) => {
          expect(() => validateSquareMatrixOrThrow(range(length))).not.toThrow();
        });
      });
    });
  });

  describe('rotateArr90', () => {
    checkBadArrThrows(rotateArr90);
    checkNonSquareMatrixThrows(rotateArr90);

    when('arr is a square matrix', () => {
      test('rotates the matrix 90 degrees clockwise', () => {
        const arr = [1, 2, 3, 4];
        rotateArr90(arr);
        expect(arr).toEqual([3, 1, 4, 2]);

        const arr2 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        rotateArr90(arr2);
        expect(arr2).toEqual([7, 4, 1, 8, 5, 2, 9, 6, 3]);
      });
    });
  });

  describe('reflectOverHorizontal', () => {
    checkBadArrThrows(reflectOverHorizontal);
    checkBadRowsThrows(reflectOverHorizontal);

    when('arr is not a matrix', () => {
      const arr = range(144);
      const invalidMatrixRowValues = range(arr.length + 1, 1).filter((rows) => ((arr.length % rows) !== 0));
      invalidMatrixRowValues.forEach((rows) => expect(() => reflectOverHorizontal(arr, rows)).toThrow());
    });

    when('arr is a matrix', () => {
      when('there is only one row', () => {
        test('does nothing', () => {
          const arr = [1, 2, 3];
          reflectOverHorizontal(arr, 1);
          expect(arr).toEqual([1, 2, 3]);
        });
      });

      test('reflects the matrix over the horizontal axis', () => {
        const arr = [1, 2, 3, 4];
        reflectOverHorizontal(arr, 2);
        expect(arr).toEqual([3, 4, 1, 2]);

        const arr2 = [1, 2, 3, 4, 5, 6];
        reflectOverHorizontal(arr2, 3);
        expect(arr2).toEqual([5, 6, 3, 4, 1, 2]);
      });
    });
  });

  describe('reflectOverVertical', () => {
    checkBadArrThrows(reflectOverVertical);
    checkBadRowsThrows(reflectOverVertical);

    when('arr is not a matrix', () => {
      const arr = range(144);
      const invalidMatrixRowValues = range(arr.length + 1, 1).filter((rows) => ((arr.length % rows) !== 0));
      invalidMatrixRowValues.forEach((rows) => expect(() => reflectOverVertical(arr, rows)).toThrow());
    });

    when('arr is a matrix', () => {
      when('there is only one column', () => {
        test('does nothing', () => {
          const arr = [1, 2, 3];
          reflectOverVertical(arr, 3);
          expect(arr).toEqual([1, 2, 3]);
        });
      });

      test('reflects the matrix over the vertical axis', () => {
        const arr = [1, 2, 3, 4];
        reflectOverVertical(arr, 2);
        expect(arr).toEqual([2, 1, 4, 3]);

        const arr2 = [1, 2, 3, 4, 5, 6];
        reflectOverVertical(arr2, 3);
        expect(arr2).toEqual([2, 1, 4, 3, 6, 5]);
      });
    });
  });

  describe('reflectOverDiagonal', () => {
    checkBadArrThrows(reflectOverDiagonal);
    checkNonSquareMatrixThrows(reflectOverDiagonal);

    when('arr is a square matrix', () => {
      when('arr is small (length < 4)', () => {
        test('does nothing', () => {
          const arr = [1];
          reflectOverDiagonal(arr);
          expect(arr).toEqual([1]);
        });
      });

      test('reflects the matrix over the diagonal axis', () => {
        const arr = [
          1, 2,
          3, 4
        ];
        reflectOverDiagonal(arr);
        expect(arr).toEqual([
          4, 2,
          3, 1
        ]);

        const arr2 = [
           1,  2,  3,  4,
           5,  6,  7,  8,
           9, 10, 11, 12,
          13, 14, 15, 16
        ];
        reflectOverDiagonal(arr2);
        expect(arr2).toEqual([
          16, 12,  8,  4,
          15, 11,  7,  3,
          14, 10,  6,  2,
          13,  9,  5,  1
        ]);
      });
    });
  });

  describe('reflectOverAntiDiagonal', () => {
    checkBadArrThrows(reflectOverAntiDiagonal);
    checkNonSquareMatrixThrows(reflectOverAntiDiagonal);

    when('arr is a square matrix', () => {
      when('arr is small (length < 4)', () => {
        test('does nothing', () => {
          const arr = [1];
          reflectOverAntiDiagonal(arr);
          expect(arr).toEqual([1]);
        });
      });

      test('reflects the matrix over the anti-diagonal axis', () => {
        const arr = [
          1, 2,
          3, 4
        ];
        reflectOverAntiDiagonal(arr);
        expect(arr).toEqual([
          1, 3,
          2, 4
        ]);

        const arr2 = [
           1,  2,  3,  4,
           5,  6,  7,  8,
           9, 10, 11, 12,
          13, 14, 15, 16
        ];
        reflectOverAntiDiagonal(arr2);
        expect(arr2).toEqual([
          1,  5,  9, 13,
          2,  6, 10, 14,
          3,  7, 11, 15,
          4,  8, 12, 16
        ]);
      });
    });
  });
});
