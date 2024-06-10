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
