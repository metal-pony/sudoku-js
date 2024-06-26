function errIfIndicesOutOfBounds(arr, a, b) {
  if (!arr || arr.length === 0) {
    throw new Error('arr must be a non-empty array');
  }

  if (
    !Number.isSafeInteger(a) ||
    !Number.isSafeInteger(b) ||
    a < 0 || a >= arr.length ||
    b < 0 || b >= arr.length
  ) {
    throw new Error(`indices must be positive integers within [${0},${arr.length})`);
  }
}

/**
 * Returns an array of numbers from `start` to `end` (exclusive).
 * If `start` is omitted, it defaults to 0.
 * @param {number} start (default: 0)
 * @param {number} end (exclusive)
 * @returns {number[]}
 */
export const range = (end, start = 0) => {
  const result = [];
  for (let i = start; i < end; i++) {
    result.push(i);
  }
  return result;
};

/**
 * Shuffles the given array using Fisher-Yates.
 * @param {any[]} arr
 * @returns {any[]}
 */
export function shuffle(arr) {
  let tmp, j;
  for (let i = arr.length - 1; i > 0; i--) {
    j = (Math.random() * (i+1)) | 0;
    tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 *
 * @param {any[]} arr
 * @param {number} i
 * @param {number} j
 */
export function swap(arr, i, j) {
  errIfIndicesOutOfBounds(arr, i, j);
  const tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
}

/**
 * Swaps all occurrences of `a` and `b` in the given array.
 * @param {any[]} arr
 * @param {number} a
 * @param {number} b
 * @returns {void}
 */
export function swapAllInArr(arr, a, b) {
  if (!arr || arr.length === 0) {
    throw new Error('arr must be a non-empty array');
  }

  if (a === b) return;

  const len = arr.length;
  for (let i = 0; i < len; i++) {
    if (arr[i] === a) arr[i] = b;
    else if (arr[i] === b) arr[i] = a;
  }
};

/**
 *
 * @param {any[]} arr The matrix to check.
 * @param {number} rows The number of rows in the matrix.
 * @returns {boolean} `true` if `arr` is a matrix, `false` otherwise.
 */
export const isMatrix = (arr, rows) => (
  Array.isArray(arr) && arr.length > 0 &&
  Number.isSafeInteger(rows) && rows > 0 &&
  Number.isSafeInteger(arr.length / rows)
);

/**
 *
 * @param {any[]} arr The matrix to check.
 * @returns {boolean} `true` if `arr` is a square matrix, `false` otherwise.
 */
export const isSquareMatrix = (arr) => (
  Array.isArray(arr) && isMatrix(arr, Math.sqrt(arr.length))
);

/**
 *
 * @param {*} arr The matrix to validate.
 * @param {*} rows The number of rows in the matrix.
 */
export function validateMatrixOrThrow(arr, rows) {
  if (!isMatrix(arr, rows)) throw new Error(`arr is not a matrix`);
}

/**
 *
 * @param {*} arr The matrix to validate.
 */
export function validateSquareMatrixOrThrow(arr) {
  if (!isSquareMatrix(arr)) throw new Error(`arr is not a square matrix`);
}

/**
 * Rotates the given matrix array 90 degrees clockwise.
 * If `arr` is not a square matrix, an error will be thrown.
 * @param {any[]} arr The matrix to rotate.
 */
export function rotateArr90(arr) {
  validateSquareMatrixOrThrow(arr);

  const n = Math.sqrt(arr.length);
  for (let layer = 0; layer < n / 2; layer++) {
    const first = layer;
    const last = n - 1 - layer;
    for (let i = first; i < last; i++) {
      const offset = i - first;
      const top = arr[first * n + i];
      arr[first * n + i] = arr[(last - offset) * n + first];
      arr[(last - offset) * n + first] = arr[last * n + (last - offset)];
      arr[last * n + (last - offset)] = arr[i * n + last];
      arr[i * n + last] = top;
    }
  }
}

/**
 * Reflects the board values over the horizontal axis (line from bottom to top).
 * If the `arr.length / rows` is not a whole number, an error will be thrown.
 * @param {any[]} arr The matrix to reflect.
 * @param {number} rows The number of rows in the matrix.
 */
export function reflectOverHorizontal(arr, rows) {
  validateMatrixOrThrow(arr, rows);
  if (rows < 2) return;

  const cols = arr.length / rows;
  for (let r = 0; r < (rows / 2); r++) {
    for (let c = 0; c < cols; c++) {
      swap(
        arr,
        r * cols + c,
        (rows - r - 1) * cols + c
      );
    }
  }
}

/**
 * Reflects the board values over the vertical axis (line from left to right).
 * If the `arr.length / rows` is not a whole number, an error will be thrown.
 * @param {any[]} arr The matrix to reflect.
 * @param {number} rows The number of rows in the matrix.
 */
export function reflectOverVertical(arr, rows) {
  validateMatrixOrThrow(arr, rows);
  const cols = arr.length / rows;
  if (arr.length < 2) return;

  for (let c = 0; c < (cols / 2); c++) {
    for (let r = 0; r < rows; r++) {
      swap(
        arr,
        r * cols + c,
        r * cols + (cols - c - 1)
      );
    }
  }
}

/**
 * Reflects the board values over the diagonal axis (line from bottomleft to topright).
 * If `arr` is not a square matrix, an error will be thrown.
 * @param {any[]} arr
 */
export function reflectOverDiagonal(arr) {
  validateSquareMatrixOrThrow(arr);
  if (arr.length < 4) return;
  reflectOverVertical(arr, Math.sqrt(arr.length));
  rotateArr90(arr);
}

/**
 * Reflects the board values over the antidiagonal axis (line from bottomright to topleft).
 * If `arr` is not a square matrix, an error will be thrown.
 * @param {any[]} arr
 */
export function reflectOverAntiDiagonal(arr) {
  validateSquareMatrixOrThrow(arr);
  if (arr.length < 4) return;
  rotateArr90(arr);
  reflectOverVertical(arr, Math.sqrt(arr.length));
}
