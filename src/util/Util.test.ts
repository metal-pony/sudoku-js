import * as Util from './Util';

describe('Util', () => {
  describe('bounded', () => {
    describe('when min > max', () => {
      test('throws an error', () => {
        expect(() => Util.bounded(0, 1, 0)).toThrowError();
      });
    });

    test('returns the bounded value', () => {
      [
        { value: 5, min: 0, max: 10, expected: 5 },
        { value: 0, min: 0, max: 10, expected: 0 },
        { value: 10, min: 0, max: 10, expected: 10 },
        { value: -1, min: 0, max: 10, expected: 0 },
        { value: 11, min: 0, max: 10, expected: 10 },
        { value: 5, min: -5, max: 5, expected: 5 },
        { value: -5, min: -5, max: 5, expected: -5 },
        { value: -6, min: -5, max: 5, expected: -5 },
        { value: 6, min: -5, max: 5, expected: 5 }
      ].forEach(({ value, min, max, expected }) => {
        expect(Util.bounded(value, min, max)).toBe(expected);
      });
    });
  });

  describe('shuffle', () => {
    test('shuffles the array', () => {
      const originalArr: string[] = 'ima potato skin reeee asiu87yoj54g'.split('');
      const arr = [...originalArr];
      const shuffled = Util.shuffle(arr);

      // The shuffled array should (usually) not be the same as the original array.
      // This test is capable of failing if the shuffle algorithm happens to produce
      // the same array as the original, but the probability of that happening is
      // extremely low.
      expect(shuffled).not.toEqual(originalArr);
      expect(shuffled).toHaveLength(originalArr.length);
      expect(shuffled).toBe(arr);
      expect(shuffled.sort()).toEqual(originalArr.sort());
    });
  });

  describe('swap', () => {
    test('swaps the elements at the given indices and returns the given array', () => {
      const originalArr = [1, 2, 3, 4, 5];
      const arr = [...originalArr];
      const actual = Util.swap(arr, 1, 3);

      expect(actual).toEqual([1, 4, 3, 2, 5]);
      expect(actual).toBe(arr);
      expect(actual.sort()).toEqual(originalArr.sort());
    });
  });

  describe('range', () => {
    test('returns an array of numbers from start to end', () => {
      expect(Util.range(0, 4)).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('validation', () => {
    describe('validateNonNegative', () => {
      test('returns the value if it is non-negative', () => {
        [0, 1, 2, 3].forEach((value) => {
          expect(Util.validateNonNegative(value, 'test')).toBe(value);
        });
      });

      test('throws an error if the value is negative', () => {
        [-1, -2, -3].forEach((value) => {
          expect(() => Util.validateNonNegative(value, 'test')).toThrowError();
        });
      });
    });

    describe('validatePositive', () => {
      test('returns the value if it is positive', () => {
        [1, 2, 3].forEach((value) => {
          expect(Util.validatePositive(value, 'test')).toBe(value);
        });
      });

      test('throws an error if the value is zero or negative', () => {
        [0, -1].forEach((value) => {
          expect(() => Util.validatePositive(value, 'test')).toThrowError();
        });
      });
    });

    describe('validateNegative', () => {
      test('returns the value if it is negative', () => {
        [-1, -2, -3].forEach((value) => {
          expect(Util.validateNegative(value, 'test')).toBe(value);
        });
      });

      test('throws an error if the value is zero or positive', () => {
        [0, 1, 2, 3].forEach((value) => {
          expect(() => Util.validateNegative(value, 'test')).toThrowError();
        });
      });
    });

    describe('validateInteger', () => {
      test('returns the value if it is an integer', () => {
        [0, 1, -1].forEach((value) => {
          expect(Util.validateInteger(value, 'test')).toBe(value);
        });
      });

      test('throws an error if the value is not an integer', () => {
        [1.5, -1.5].forEach((value) => {
          expect(() => Util.validateInteger(value, 'test')).toThrowError();
        });
      });
    });

    describe('validatePositiveInteger', () => {
      test('returns the value if it is a positive integer', () => {
        [1, 2, 3].forEach((value) => {
          expect(Util.validatePositiveInteger(value, 'test')).toBe(value);
        });
      });

      test('throws an error if the value is zero, negative, or not an integer', () => {
        [0, -1, 1.5].forEach((value) => {
          expect(() => Util.validatePositiveInteger(value, 'test')).toThrowError();
        });
      });
    });

    describe('validateNegativeInteger', () => {
      test('returns the value if it is a negative integer', () => {
        [-1, -2, -3].forEach((value) => {
          expect(Util.validateNegativeInteger(value, 'test')).toBe(value);
        });
      });

      test('throws an error if the value is zero, positive, or not an integer', () => {
        [0, 1, -1.5].forEach((value) => {
          expect(() => Util.validateNegativeInteger(value, 'test')).toThrowError();
        });
      });
    });
  });
});
