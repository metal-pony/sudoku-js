/**
 * Returns a random integer between min and max, inclusive.
 *
 * @param value The value to bind.
 * @param min The minimum value, inclusive.
 * @param max The maximum value, inclusive.
 * @returns A random integer between min and max, inclusive.
 */
export const bounded = (value: number, min: number, max: number): number => {
  if (min > max) {
    throw new Error(`min must be less than or equal to max`);
  }

  return Math.min(Math.max(min, value), max);
};

/**
 * Shuffles the given array in place using the Fisher-Yates algorithm.
 *
 * @param arr The array to shuffle.
 * @returns The given array for convenience.
 */
export const shuffle = (arr: any[]): any[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    swap(arr, i, Math.floor(Math.random() * (i + 1)));
  }
  return arr;
};

/**
 * Swaps the elements at the given indices in the given array.
 *
 * @param arr The array in which to swap elements.
 * @param i The index of the first element to swap.
 * @param j The index of the second element to swap.
 * @returns The given array for convenience.
 */
export const swap = (arr: any[], i: number, j: number): any[] => {
  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
  return arr;
};

/**
 * Returns an array of numbers from start to end, inclusive.
 *
 * @param start The first number in the range.
 * @param end The last number in the range.
 * @returns An array of numbers from start to end, inclusive.
 */
export const range = (start: number, end: number): number[] => {
  const result = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
};

/**
 * Returns the given value if it is non-negative, otherwise throws an error.
 */
export const validateNonNegative = (value: number, name: string): number => {
  if (value < 0) {
    throw new Error(`${name} must be non-negative`);
  }
  return value;
};

/**
 * Returns the given value if it is positive, otherwise throws an error.
 */
export const validatePositive = (value: number, name: string): number => {
  if (value <= 0) {
    throw new Error(`${name} must be positive`);
  }
  return value;
};

/**
 * Returns the given value if it is negative, otherwise throws an error.
 */
export const validateNegative = (value: number, name: string): number => {
  if (value >= 0) {
    throw new Error(`${name} must be negative`);
  }
  return value;
};

/**
 * Returns the given value if it is an integer, otherwise throws an error.
 */
export const validateInteger = (value: number, name: string): number => {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }
  return value;
};

/**
 * Returns the given value if it is a positive integer, otherwise throws an error.
 */
export const validatePositiveInteger = (value: number, name: string): number => {
  validateInteger(value, name)
  return validatePositive(value, name);
};

/**
 * Returns the given value if it is a negative integer, otherwise throws an error.
 */
export const validateNegativeInteger = (value: number, name: string): number => {
  validateInteger(value, name);
  return validateNegative(value, name);
};
