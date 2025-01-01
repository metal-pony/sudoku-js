/**
 * Returns a random integer between 0 and max, exclusive.
 * @param {number} max
 */
export function randInt(max) {
  return (Math.random() * max) | 0;
}

/**
 * Returns a random element from the given array.
 * If the array is empty, returns null.
 * @param {any[]} arr
 * @returns {any | null}
 */
export function chooseRandom(arr) {
  return (arr.length > 0) ? arr[randInt(arr.length)] : null;
}

/**
 * Removes and returns a random element from the given array.
 * If the array is empty, returns null.
 * @param {any[]} arr
 * @returns {any | null}
 */
export function removeRandom(arr) {
  return (arr.length > 0) ? arr.splice(randInt(arr.length), 1)[0] : null;
}

/**
 * Returns the number of 1 bits in the given bigint.
 *
 * If negative, uses `(-n)`.
 * @param {bigint} bigN
 * @returns {number}
 */
export function countBigBits(bigN) {
  if (bigN < 0n) {
    bigN = -bigN;
  }

  let count = 0;
  while (bigN > 0n) {
    if (bigN & 1n) {
      count++;
    }
    bigN >>= 1n;
  }
  return count;
}

/**
 * Returns the number of 1 bits in the given number.
 *
 * If negative, uses `(-n)`.
 * @param {number} n
 * @returns {number}
 */
export function countBits(n) {
  if (n < 0) {
    n = -n;
  }

  let count = 0;
  while (n > 0) {
    if (n & 1) {
      count++;
    }
    n >>= 1;
  }
  return count;
}

/**
 * Returns a random integer between min and max, inclusive.
 * @param {number} value The value to bind.
 * @param {number} min The minimum value, inclusive.
 * @param {number} max The maximum value, inclusive.
 * @returns {number} A random integer between min and max, inclusive.
 */
export const bounded = (value, min, max) => {
  if (min > max) {
    throw new Error(`min must be less than or equal to max`);
  }

  return Math.min(Math.max(min, value), max);
};

/**
 * Returns the given value if it is non-negative, otherwise throws an error.
 * @param {number} value The value to validate.
 * @param {string} name The name of the value to print if there's an error.
 * @returns {number} The given value if it is non-negative.
 */
export const validateNonNegative = (value, name) => {
  if (value < 0) {
    throw new Error(`${name} must be non-negative`);
  }
  return value;
};

/**
 * Returns the given value if it is positive, otherwise throws an error.
 * @param {number} value The value to validate.
 * @param {string} name The name of the value to print if there's an error.
 * @returns {number} The given value if it is positive.
 */
export const validatePositive = (value, name) => {
  if (value <= 0) {
    throw new Error(`${name} must be positive`);
  }
  return value;
};

/**
 * Returns the given value if it is negative, otherwise throws an error.
 * @param {number} value The value to validate.
 * @param {string} name The name of the value to print if there's an error.
 * @returns {number} The given value if it is negative.
 */
export const validateNegative = (value, name) => {
  if (value >= 0) {
    throw new Error(`${name} must be negative`);
  }
  return value;
};

/**
 * Returns the given value if it is an integer, otherwise throws an error.
 * @param {number} value The value to validate.
 * @param {string} name The name of the value to print if there's an error.
 * @returns {number} The given value if it is an integer.
 */
export const validateInteger = (value, name) => {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }
  return value;
};

/**
 * Returns the given value if it is a positive integer, otherwise throws an error.
 * @param {number} value The value to validate.
 * @param {string} name The name of the value to print if there's an error.
 * @returns {number} The given value if it is a positive integer.
 */
export const validatePositiveInteger = (value, name) => {
  validateInteger(value, name)
  return validatePositive(value, name);
};

/**
 * Returns the given value if it is a negative integer, otherwise throws an error.
 * @param {number} value The value to validate.
 * @param {string} name The name of the value to print if there's an error.
 * @returns {number} The given value if it is a negative integer.
 */
export const validateNegativeInteger = (value, name) => {
  validateInteger(value, name);
  return validateNegative(value, name);
};
