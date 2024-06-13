import * as common from '../../src/util/common.js';

describe('bounded', () => {
  describe('when min > max', () => {
    test('throws an error', () => {
      expect(() => common.bounded(0, 1, 0)).toThrowError();
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
      expect(common.bounded(value, min, max)).toBe(expected);
    });
  });
});

describe('validation', () => {
  describe('validateNonNegative', () => {
    test('returns the value if it is non-negative', () => {
      [0, 1, 2, 3].forEach((value) => {
        expect(common.validateNonNegative(value, 'test')).toBe(value);
      });
    });

    test('throws an error if the value is negative', () => {
      [-1, -2, -3].forEach((value) => {
        expect(() => common.validateNonNegative(value, 'test')).toThrowError();
      });
    });
  });

  describe('validatePositive', () => {
    test('returns the value if it is positive', () => {
      [1, 2, 3].forEach((value) => {
        expect(common.validatePositive(value, 'test')).toBe(value);
      });
    });

    test('throws an error if the value is zero or negative', () => {
      [0, -1].forEach((value) => {
        expect(() => common.validatePositive(value, 'test')).toThrowError();
      });
    });
  });

  describe('validateNegative', () => {
    test('returns the value if it is negative', () => {
      [-1, -2, -3].forEach((value) => {
        expect(common.validateNegative(value, 'test')).toBe(value);
      });
    });

    test('throws an error if the value is zero or positive', () => {
      [0, 1, 2, 3].forEach((value) => {
        expect(() => common.validateNegative(value, 'test')).toThrowError();
      });
    });
  });

  describe('validateInteger', () => {
    test('returns the value if it is an integer', () => {
      [0, 1, -1].forEach((value) => {
        expect(common.validateInteger(value, 'test')).toBe(value);
      });
    });

    test('throws an error if the value is not an integer', () => {
      [1.5, -1.5].forEach((value) => {
        expect(() => common.validateInteger(value, 'test')).toThrowError();
      });
    });
  });

  describe('validatePositiveInteger', () => {
    test('returns the value if it is a positive integer', () => {
      [1, 2, 3].forEach((value) => {
        expect(common.validatePositiveInteger(value, 'test')).toBe(value);
      });
    });

    test('throws an error if the value is zero, negative, or not an integer', () => {
      [0, -1, 1.5].forEach((value) => {
        expect(() => common.validatePositiveInteger(value, 'test')).toThrowError();
      });
    });
  });

  describe('validateNegativeInteger', () => {
    test('returns the value if it is a negative integer', () => {
      [-1, -2, -3].forEach((value) => {
        expect(common.validateNegativeInteger(value, 'test')).toBe(value);
      });
    });

    test('throws an error if the value is zero, positive, or not an integer', () => {
      [0, 1, -1.5].forEach((value) => {
        expect(() => common.validateNegativeInteger(value, 'test')).toThrowError();
      });
    });
  });
});
