import {
  range,
  rotateArr90,
  reflectOverHorizontal,
  reflectOverVertical,
  reflectOverDiagonal,
  reflectOverAntiDiagonal,
  shuffle,
  swapAllInArr,
  swap,
  chooseRandom,
  countBigBits,
  countBits,
  randInt
} from '../util/arrays.js';
import { randomBitCombo } from '@metal-pony/counting-js';
import SudokuSieve, { searchForItemsFromMask, seedSieveDc } from './SudokuSieve.js';
import { NCK, randomBig } from '../util/combos.js';

export const RANK = 3;
/** The number of digits used in sudoku.*/
export const DIGITS = 9;
/** Represents the combination of all candidates for a given cell on a sudoku board.*/
export const ALL = 511;
/** The number of spaces on a sudoku board.*/
export const SPACES = 81;
/** The minimum number of clues required for a sudoku puzzle.*/
export const MIN_CLUES = 17;

/**
 * Contains the digits 1-9.
 * This can be shuffled and reused for various purposes,
 * but do not add or remove elements, else shit will break.
 */
const DIGIT_BAG = range(DIGITS + 1, 1);

/** Used to pull out row constraints. */
const ROW_MASK = ALL << (DIGITS * 2);
/** Used to pull out column constraints. */
const COLUMN_MASK = ALL << DIGITS;
/** Used to pull out region constraints. */
const REGION_MASK = ALL;
const FULL_CONSTRAINTS = ROW_MASK | COLUMN_MASK | REGION_MASK;

const DIGIT_MASKS = [0, ...range(DIGITS).map((d) => (1 << d))];
/**
 * Encodes a digit as a bitmask.
 *
 * Note: The higher order bits correspond with higher digit values.
 *
 * Examples:
 *
 * `digitMask(2) => 0b000000010`
 *
 * `digitMask(9) => 0b100000000`
 * @param {number} digit in the interval [1, 9]`;
 */
export const digitMask = (digit) => DIGIT_MASKS[digit];

/**
 * Returns an array of cell indices from the given mask.
 * @param {bigint} mask
 * @returns {number[]}
 */
export function cellsFromMask(mask) {
  const cells = [];
  let ci = SPACES - 1;
  while (mask > 0n) {
    if (mask & 1n) {
      cells.push(ci);
    }
    mask >>= 1n;
    ci--;
  }
  return cells;
}

const CELL_MASKS = range(SPACES).map((cellIndex) => (1n << (BigInt(SPACES - cellIndex - 1))));
/**
 * Maps each cell index to a mask representing it and its symmetric counterpart cell.
 * If `ci` is a cell index, then its counterpart is at position 80 - ci.
 */
const CELL_MASK_COMPLEMENTS = range(SPACES).map((cellIndex) => {
  return (
    (1n << (BigInt(SPACES - cellIndex - 1))) |
    (1n << (BigInt(cellIndex)))
  );
});

/**
 * Encodes a cell index as a bitmask.
 *
 * Note: The leftmost bit correspond with the topleft board space (`cellIndex 0`).
 * @param {number} cellIndex in the interval [0,81);
 */
export const cellMask = (cellIndex) => CELL_MASKS[cellIndex];

/**
 * Maps digits (the indices) to their encoded board values.
 * @type {number[]}
 **/
const ENCODER = [0, ...range(DIGITS).map((shift) => 1<<shift)];
/**
 * Maps encoded board values (the indices) to the digits they represent.
 * @type {number[]}
 **/
const DECODER = range(1<<DIGITS).fill(0);
range(DIGITS).map((shift) => DECODER[1<<shift] = shift + 1);

/**
 * Maps the encoded board values (the indices) to the lists of candidate digits they represent.
 * @type {number[][]}
 **/
const CANDIDATE_DECODINGS = range(1<<DIGITS).map(encoded => {
  const candidates = [];
  for (let digit = 1; encoded > 0 && digit <= DIGITS; digit++, encoded >>= 1) {
    if (encoded & 1) {
      candidates.push(digit);
    }
  }
  return candidates;
});

/**
 * Performs some function for each candidate digit in the given encoded value.
 * @param {number} encoded
 * @param {(candidateDigit: number) => void} callback
 */
export const forEachCandidate = (encoded, callback) => CANDIDATE_DECODINGS[encoded].forEach(d => callback(d));

/**
 * Maps the encoded board values (the indices) to the list of candidate digits (ENCODED) they represent.
 * @type {number[][]}
 **/
const CANDIDATES = CANDIDATE_DECODINGS.map(c => c.map(digit => ENCODER[digit]));

const BIT_COUNT_MAP = range(1<<DIGITS).map(countBits);

/**
 * Cache of Sudoku board indices for each row, column, and region.
 * @type {{row: number[][], col: number[][], region: number[][]}}
 * @example
 * indicesFor.row[0] // [0, 1, 2, 3, 4, 5, 6, 7, 8]
 * indicesFor.col[0] // [0, 9, 18, 27, 36, 45, 54, 63, 72]
 * indicesFor.regions[0] // [0, 1, 2, 9, 10, 11, 18, 19, 20]
 */
export const indicesFor = Object.freeze({
  row: range(DIGITS).map((row) => range((row+1)*DIGITS, row*DIGITS)),
  col: range(DIGITS).map((col) => range(DIGITS).map((row) => col + row*DIGITS)),
  region: range(DIGITS).map((region) => range(DIGITS).map((i) => {
    // const n = Math.sqrt(NUM_DIGITS);
    const rRow = (region/RANK) | 0;
    const rCol = region%RANK;
    return (rRow*(RANK**3) + rCol*RANK + ((i/RANK)|0)*DIGITS + (i%RANK));
  }))
});

/**
 * 81-Bit board masks useful for filtering different board areas.
 * @type {{none: bigint, all: bigint, row: bigint[], col: bigint[], region: bigint[]}}
 */
export const masksFor = {
  none: 0n,
  all: (1n << 81n) - 1n,
  row: indicesFor.row.map(row => row.reduce((mask, ci) => (mask | cellMask(ci)), 0n)),
  col: indicesFor.col.map(col => col.reduce((mask, ci) => (mask | cellMask(ci)), 0n)),
  region: indicesFor.region.map((reg) => reg.reduce((mask, ci) => (mask | cellMask(ci)), 0n)),
};

/**
 * Encodes a digit value.
 * @param {number} digit From 0 - 9
 */
export const encode = (digit) => ENCODER[digit];

/**
 * Decodes an encoded value.
 * @param {number} encoded
 */
export const decode = (encoded) => DECODER[encoded];

/**
 * Returns whether the given encoded value represents a digit.
 * @param {number} encoded
 */
export const isDigit = (encoded) => DECODER[encoded] > 0;

/** Maps cell indices to rows. */
const CELL_ROWS = range(SPACES).map((cellIndex) => (cellIndex / DIGITS) | 0);
/**
 * Returns the row index of the given cell.
 * @param {number} cellIndex
 */
export const cellRow = (cellIndex) => CELL_ROWS[cellIndex];

/** Maps cell indices to columns. */
const CELL_COLS = range(SPACES).map((cellIndex) => cellIndex % DIGITS);
/**
 * Returns the column index of the given cell.
 * @param {number} cellIndex
 */
export const cellCol = (cellIndex) => CELL_COLS[cellIndex];

/** Maps cell indices to regions. */
const CELL_REGIONS = range(SPACES).map((cellIndex) => (
  (cellIndex / 27) | 0) * 3 + (((cellIndex % 9) / 3) | 0
));
/**
 * Returns the region index of the given cell.
 * @param {number} cellIndex
 */
export const cellRegion = (cellIndex) => CELL_REGIONS[cellIndex];

/** Maps cell indices to cell indices of row neighbors. Excludes itself. */
const ROW_NEIGHBORS = range(SPACES).map((ci) => indicesFor.row[CELL_ROWS[ci]].filter(i => i !== ci));
/** Maps cell indices to cell indices of column neighbors. Excludes itself. */
const COL_NEIGHBORS = range(SPACES).map((ci) => indicesFor.col[CELL_COLS[ci]].filter(i => i !== ci));
/** Maps cell indices to cell indices of region neighbors. Excludes itself. */
const REGION_NEIGHBORS = range(SPACES).map((ci) => indicesFor.region[CELL_REGIONS[ci]].filter(i => i !== ci));
/**
 * Maps cell indices to cell indices of row, column, and region neighbors. Excludes itself.
 * @type {number[][]}
 */
export const CELL_NEIGHBORS = range(SPACES).map((ci) => {
  /** @type {Set<number>} */
  const neighbors = new Set();
  ROW_NEIGHBORS[ci].forEach(n => neighbors.add(n));
  COL_NEIGHBORS[ci].forEach(n => neighbors.add(n));
  REGION_NEIGHBORS[ci].forEach(n => neighbors.add(n));
  return [...neighbors];
});

/** Returns the region index of the given cell.*/
export const cellRegion2D = (row, col) => CELL_REGIONS[row * DIGITS + col];

/**
 * Returns whether an area on a Sudoku board (row, column, or region)
 * is valid given the digits of the cells that make up the area.
 * @param {number[]} areaDigits
 * @returns {boolean}
 */
export function isAreaValid(areaDigits) {
  let reduced = 0;
  for (let d of areaDigits) {
    if (d > 0 && d <= DIGITS) {
      const e = encode(d);
      if ((reduced & e) > 0) return false;
      reduced |= e;
    }
  }
  return true;
}

/**
 * Returns whether an area on a Sudoku board is full (all cells contain digits).
 *
 * Does not check area validity.
 * @param {number[]} areaVals
 * @returns {boolean}
 */
const isAreaFull = (areaVals) => areaVals.every(d => (d > 0 && d <= DIGITS));

class SearchNode {
  /**
   * @param {Sudoku} sudoku
   */
  constructor() {
    this.sudoku = new Sudoku();
    this.emptyCellIndex = -1;
    this.candidates = -1;
  }

  load(otherSudoku) {
    this.sudoku.copyFrom(otherSudoku);
    this.pickCell();
  }

  pickCell() {
    this.candidates = -1;
    this.emptyCellIndex = this.sudoku._pickEmptyCell();
    if (this.emptyCellIndex != -1) {
      this.candidates = this.sudoku._candidates[this.emptyCellIndex];
    }
  }

  next(reductionLevel = 1) {
    // No further branches to try (sudoku is probably invalid or solved).
    if (!this.hasNext()) return null;

    return this._next(new SearchNode(), reductionLevel);
  }

  /**
   *
   * @param {SearchNode} nextNode
   * @param {number} reductionLevel
   * @returns {SearchNode}
   */
  _next(nextNode, reductionLevel = 1) {
    nextNode.sudoku.copyFrom(this.sudoku);

    // Pick a random candidate and set it in the next node.
    const candidateDigits = CANDIDATE_DECODINGS[this.candidates];
    const randomCandidateDigit = chooseRandom(candidateDigits);
    nextNode.sudoku.setDigit(randomCandidateDigit, this.emptyCellIndex);
    this.candidates &= ~ENCODER[randomCandidateDigit];

    nextNode.sudoku._reduce(reductionLevel);
    nextNode.pickCell();

    return nextNode;
  }

  hasNext() {
    return (this.candidates > 0 && this.sudoku.isValid());
  }
};

export class SudokuNode {
  /**
   *
   * @param {Sudoku} sudoku
   * @param {SudokuNode | null} prev
   */
  constructor(sudoku, prev = null) {
    /** @type {Sudoku} */
    this.sudoku = sudoku;

    /** @type {SudokuNode} */
    this.prev = prev;

    /** @type {SudokuNode[]} */
    this.nexts = null;

    /** @type {boolean} */
    this.visited = false;
  }

  visit() {
    this.visited = true;
  }

  dispose() {
    this.sudoku = null;
    this.nexts = null;
  }

  _findNexts(omittedNextCells = []) {
    this.nexts ??= this.sudoku.board.reduce((nexts, digit, ci) => {
      if (digit > 0 && !omittedNextCells.includes(ci)) {
        const bCopy = new Sudoku(this.sudoku);
        bCopy.setDigit(0, ci);
        nexts.push(new SudokuNode(bCopy, this));
      }
      return nexts;
    }, []);
  }

  /**
   * Attempts to get a random, unvisited neighbor of this node.
   * Populates the list of neighbors for this node if it does not yet exist.
   * @param {number[]} [omittedNextCells] An array of cell indices to omit from the list of neighbors.
   * @return {SudokuNode} A random unvisited neighbor node.
   */
  getNextUnvisited(omittedNextCells = []) {
    this._findNexts(omittedNextCells);
    return chooseRandom(this.nexts.filter(n => (n !== null && !n.visited)));
  }
}

export class SearchState {
  /**
   * Creates a new object used for searching for sudoku solutions.
   * @param {Sudoku?} puzzle (Optional) A sudoku puzzle to initialize with.
   */
  constructor(puzzle) {
    /**
     * Used for search.
     * @type {SearchNode[]}
     */
    this._stack = Array(SPACES).fill(0).map(_=>new SearchNode());

    this._stackSize = 0;

    /**
     * The last solution found.
     * `null` if no solution found.
     * @type {Sudoku}
     */
    this.solution = new Sudoku();

    /**
     * A count of solutions found during search.
     */
    this._solutionCount = 0;

    if (puzzle) {
      this.init(puzzle);
    }
  }

  get numSolutions() {
    return this._solutionCount;
  }

  /**
   * Initializes the search state with the given puzzle.
   * @param {Sudoku} newPuzzle
   */
  init(newPuzzle) {
    this._solutionCount = 0;
    this._stack[0].load(newPuzzle);
    this._stackSize = 1;
    this.solution.clear();
  }

  /**
   * Advances the search state to the next solution.
   * @returns True if a solution was found; else false.
   */
  advanceToSolution(reductionLevel) {
    let top;
    while (this._stackSize > 0) {
      top = this._stack[this._stackSize - 1];
      // console.log(`${' '.repeat(this._stackSize)} ${top.sudoku.toString()}`);
      if (top.sudoku.isSolved()) {
        this.solution.copyFrom(top.sudoku);
        this._solutionCount++;
        this._stackSize--;
        return true;
      } else if (top.hasNext()) {
        top._next(this._stack[this._stackSize], reductionLevel);
        this._stackSize++;
      } else {
        this._stackSize--;
      }
    }
    return false;
  }
}

/**
 * Represents a Sudoku board.
 */
export class Sudoku {
  /**
   * Swaps the given bands by index (0, 1, or 2).
   * @param {number[]} arr
   * @param {number} band1
   * @param {number} band2
   * @returns {number[]}
   */
  static swapBands(arr, band1, band2) {
    const b1 = band1 % 3;
    const b2 = band2 % 3;
    if (b1 === b2) return;

    const band1Start = 27 * b1;
    const band2Start = 27 * b2;
    let temp;
    for (let i = 0; i < 27; i++) {
      temp = arr[band1Start + i];
      arr[band1Start + i] = arr[band2Start + i];
      arr[band2Start + i] = temp;
    }

    return arr;
  }

  /**
   * Swaps the given rows by index (0 through 8).
   * @param {number[]} arr
   * @param {number} row1
   * @param {number} row2
   * @returns {number[]}
   */
  static swapRows(arr, row1, row2) {
    const r1 = row1 % DIGITS;
    const r2 = row2 % DIGITS;
    if (r1 === r2) return;
    if (((r1/3)|0) !== ((r2/3)|0)) throw Error('rows must be in the same band');

    const r1Start = DIGITS * r1;
    const r2Start = DIGITS * r2;
    let temp;
    for (let i = 0; i < DIGITS; i++) {
      temp = arr[r1Start + i];
      arr[r1Start + i] = arr[r2Start + i];
      arr[r2Start + i] = temp;
    }

    return arr;
  }

  /**
   * Swaps the given columns by index (0 through 8).
   * @param {number[]} arr
   * @param {number} col1
   * @param {number} col2
   * @returns {number[]}
   */
  static swapColumns(arr, col1, col2) {
    const c1 = col1 % DIGITS;
    const c2 = col2 % DIGITS;
    if (c1 === c2) return;
    if (((c1/3)|0) !== ((c2/3)|0)) throw Error(`columns must be in the same stack (${col1}, ${col2})`);

    let temp;
    for (let i = 0; i < SPACES; i+=DIGITS) {
      temp = arr[i + c1];
      arr[i + c1] = arr[i + c2];
      arr[i + c2] = temp;
    }

    return arr;
  }

  /**
   * Swaps the given stacks by index (0, 1, or 2).
   * @param {number[]} arr
   * @param {number} stack1
   * @param {number} stack2
   * @returns {number[]}
   */
  static swapStacks(arr, stack1, stack2) {
    const s1 = stack1 % 3;
    const s2 = stack2 % 3;
    if (s1 === s2) return;

    const col1Start = s1 * 3;
    const col2Start = s2 * 3;
    let temp;

    for (let row = 0; row < DIGITS; row++) {
      const rowOffset = row * DIGITS;
      for (let col = 0; col < 3; col++) {
        const idx1 = rowOffset + col1Start + col;
        const idx2 = rowOffset + col2Start + col;

        temp = arr[idx1];
        arr[idx1] = arr[idx2];
        arr[idx2] = temp;
      }
    }

    return arr;
  }

  /**
   * Determines whether the given string represents a sudoku board, i.e. the
   * string is of proper length and contains only digits.
   *
   * The dot character `.` can also be used to represent an empty space.
   *
   * The dash character `-` can be used to represent 9 consecutive empty spaces.
   *
   * Does not check if the sudoku board is valid.
   * @param {string} str
   * @returns {boolean}
   */
  static validateStr(str) {
    if (!str || typeof str !== 'string' || str.length > SPACES) return false;
    // Replace '-' and '.' with '0's
    let _str = str.replace(/-/g, '0'.repeat(DIGITS)).replace(/\./g, '0');
    return (
      (_str.length === SPACES) &&
      (/^[0-9]{81}$/).test(_str)
    );
  }

  /**
   * Builds a Sudoku board from a string, where:
   * - `.` represents an empty cell.
   * - `-` represents 9 consecutive empty cells.
   *
   * An error will be thrown if `str` does not have enough characters to fill
   * the board, or if there are invalid characters.
   *
   * @param {string} str
   * @returns {Sudoku}
   * @throws {Error} If the string is not 81 characters long or contains invalid characters.
   */
  static fromString(str) {
    // Replace '-' and '.' with '0's
    let _str = str.replace(/-/g, '0'.repeat(DIGITS)).replace(/\./g, '0');

    if (_str.length !== SPACES) {
      throw new Error(`str is invalid (length): ${_str.length}. (Extrapolated: ${_str})`);
    }

    if (!/^[0-9]+$/.test(_str)) {
      throw new Error(`Expected only digits, got ${_str}.`);
    }

    const board = new Sudoku();
    _str.split('').forEach((char, index) => {
      const digit = parseInt(char);
      if (digit > 0) {
        board.setDigit(digit, index);
      }
    });

    return board;
  }

  // Uses DFS to locate valid sudoku puzzle.
  /**
   *
   * @param {number} numClues
   * @param {number} maxPops
   * @returns {Sudoku | null}
   */
  static generatePuzzle(numClues, maxPops = 1<<16) {
    const config = this.generateConfig();
    const rootNode = new SudokuNode(config);
    let puzzleStack = [rootNode];

    // let _board = Array(SPACES).fill(ALL);
    // puzzleStack.push(rootNode);

    let numPops = 0; // Number of pops. If the search resets, so does this.

    while (puzzleStack.length > 0 && numPops < maxPops) {
      const puzzleNode = puzzleStack[puzzleStack.length - 1]; // peek
      const puzzle = puzzleNode.sudoku;
      puzzleNode.visit();
      // console.log(`generatePuzzle> (empty: ${puzzle.numEmptyCells}) ${puzzle.toString()}`);

      // _board = puzzle.encodedBoard;
      if (!puzzle.hasUniqueSolution()) {
        // console.log(`generatePuzzle> no unique solution, popping...`);
        puzzleStack.pop();
        puzzleNode.dispose();

        // TODO explore whether it's possible to keep a history for each node,
        //  i.e. track which cells were attempted to be removed.
        //  Then, this won't need any sort of restart fail-safe.

        // After a certain number of pops, restart the search. This ensures that
        // that the algorithm won't continue to try to remove cells when there is
        // no path to a valid puzzle.
        if (++numPops >= 100) {
          puzzleStack = [rootNode];
          numPops = 0;
        }

        continue;
      }

      if (puzzle.numEmptyCells >= (SPACES - numClues)) {
        // console.log(`generatePuzzle> found puzzle with ${puzzle.numEmptyCells} empty cells`);
        break;
      }

      const next = puzzleNode.getNextUnvisited();
      if (next) {
        puzzleStack.push(next);
      } else {
        puzzleStack.pop();

        if (++numPops >= 100) {
          puzzleStack = [rootNode];
          numPops = 0;
        }
      }
    }

    if (numPops >= maxPops || puzzleStack.length === 0) {
      return null;
    }

    return puzzleStack[puzzleStack.length - 1].sudoku;
  }

  /**
   * Creates a new Sudoku using the digits from this one, but only set
   * for the cells corresponding to the set bits in the given mask.
   * Note: The new sudoku will not carry over any reduced candidates,
   * and constraints will be rebuilt as digits are added to the new board.
   * @param {bigint} mask Bitmask where set bits represent cells to keep.
   * @returns {Sudoku}
   */
  filter(mask) {
    return new Sudoku(this._digits.map((d, i) => (
      (mask & CELL_MASKS[i]) ? d : 0)
    ));
  }

  /**
   * Creates a string representation of this sudoku, filtered through the given mask.
   * @param {*} mask Bitmask where set bits represent cells to keep.
   */
  filterStr(mask) {
    return this._digits.map((d, i) => ((mask & CELL_MASKS[i]) ? d : '.')).join('');
  }

  /**
   * Gets a bitmask version of this grid, where bits set correspond with
   * filled-in cells (cells with single digits - not multiple candidats).
   */
  get mask() {
    return this._digits.reduce((mask, digit, ci) => (
      digit ? (mask | cellMask(ci)) : mask
    ), 0n);
  }

  /**
   * Attempts to generate a puzzle from choosing values randomly from a given solution.
   *
   * NOTE: Not ideal for generating puzzles below 24 clues.
   * @param {object} options
   * @param {Sudoku} options.solution (! REQUIRED !) A full sudoku grid.
   * @param {number} options.numClues (Default `32`) Number of clues the
   * puzzle should have. Every number lower than 27 may take exponentially longer
   * to generate.
   * @param {bigint[]} options.sieve (Default empty) An array of unavoidable sets
   * to aid generation. It's recommended to generate this when `numClues < 32`.
   * @param {boolean} options.addFailuresToSieve (Default `false`) Whether puzzle
   * generation failures should be added to the sieve. This may impact performance.
   * @param {number} options.timeoutMs (Default no time limit) Time to limit generating.
   * @returns {Sudoku | null} The generated sudoku puzzle or null if time limit is hit
   * or parameters are botched.
   */
  static randomComboPuzzle({
    solution,
    numClues = 32,
    sieve = [],
    addFailuresToSieve = false,
    timeoutMs = 0,
  }) {
    if (numClues < MIN_CLUES) return null;
    if (numClues > SPACES) return null;
    if (numClues === SPACES) return new Sudoku(solution);
    if (!solution) throw new new Error('Must provide solution');
    if (!(solution instanceof Sudoku) || !solution.isSolved())
      throw new Error('Solutions is invalid');

    let start = Date.now();
    let maskAttempts = 0;
    let puzzle; do {
      let mask; do {
        mask = randomBitCombo(SPACES, numClues);

        // Check time occasionally
        maskAttempts++;
        if (
          (timeoutMs > 0) &&
          ((maskAttempts % 1000) === 0) &&
          ((Date.now() - start) > timeoutMs)
        ) {
          return null;
        }

        // Reset mask if it's derivative of some sieve item
        for (const item of sieve) {
          if ((item & ~mask) === item) {
            mask = 0n;
            break;
          }
        }
      } while (mask === 0n);

      puzzle = solution.filter(mask);
      if (!puzzle.hasUniqueSolution()) {
        if (addFailuresToSieve) searchForItemsFromMask(solution, sieve, mask);
        puzzle = null;
      }
    } while (!puzzle);

    return puzzle;
  }

  // Uses DFS to locate valid sudoku puzzle.
  /**
   *
   * @param {object} options
   * @param {Sudoku} options.grid
   * @param {number} options.numClues
   * @param {bigint[]} options.sieve
   * @param {number} options.difficulty
   * @param {number} options.timeoutMs
   * @returns {Sudoku | null}
   */
  static generatePuzzle2({
    grid = Sudoku.generateConfig(),
    numClues = 32,
    sieve = [],
    difficulty = 0,
    timeoutMs = 0,
    useSieve = true,
  }) {
    if (numClues < MIN_CLUES || numClues > SPACES) return null;
    if (numClues === SPACES) return new Sudoku(grid);
    if (!grid) throw new Error('Must provide solution grid');
    if (!(grid instanceof Sudoku) || !grid.isSolved())
      throw new Error('Solution grid is invalid');
    if (difficulty < 0 || difficulty > 10)
      throw new Error(`Invalid difficulty (${difficulty}); expected 0 <= difficulty <= 10`);

    const start = Date.now();
    const FULLMASK = (1n << BigInt(SPACES)) - 1n;
    let maskFails = 0;
    let puzzleCheckFails = 0;
    let putBacks = 0;
    let mask = FULLMASK;
    let remaining = range(SPACES);
    let removed = [];

    while (remaining.length > numClues) {
      const startChoices = remaining.length;
      shuffle(remaining);
      for (let i = 0; i < remaining.length && remaining.length > numClues; i++) {
        const choice = remaining[i];
        mask &= ~cellMask(choice);

        // Check if mask satisfies sieve
        let satisfies = true;
        for (const item of sieve) {
          if (!(item & mask)) {
            satisfies = false;
            break;
          }
        }

        // If not, or if there are multiple solutions,
        // put the cell back and try the next
        if (!satisfies) {
          maskFails++;
          mask |= cellMask(choice);

          // Once in awhile, check the time
          if (timeoutMs > 0 && maskFails === 100) {
            if ((Date.now() - start) > timeoutMs) {
              return null;
            }
            maskFails -= 100;
          }

          continue;
        }

        if (grid.filter(mask).solutionsFlag() !== 1) {
          puzzleCheckFails++;
          if (useSieve && puzzleCheckFails === 100 && sieve.length < 36) {
            seedSieveDc({ grid, sieve, level: 2 });
          } else if (useSieve && puzzleCheckFails === 2500 && sieve.length < 200) {
            seedSieveDc({ grid, sieve, level: 3 });
          } else if (useSieve && puzzleCheckFails > 10000 && sieve.length < 1000) {
            searchForItemsFromMask(grid, sieve, mask);
          } else if (useSieve && puzzleCheckFails > 25000) {
            searchForItemsFromMask(grid, sieve, mask);
          }

          mask |= cellMask(choice);
          continue;
        }

        removed.push(choice);
        remaining.splice(i, 1);
        i--;
      }

      // If no cells were chosen, or difficulty requirement unmet
      // - Put some cells back and try again
      if (
        // (
        //   remaining.length === numClues &&
        //   difficulty > 0 &&
        //   grid.filter(mask).solutionsFlag() === 1 &&
        //   grid.filter(mask).difficulty() !== difficulty
        // ) ||
        remaining.length === startChoices
      ) {
        const numToPutBack = 1 + (putBacks % 4) + (((putBacks % 8)*Math.random())|0);
        shuffle(removed);
        for (let i = 0; i < numToPutBack; i++) {
          const cell = removed.pop();
          remaining.push(cell);
          mask |= cellMask(cell);
          if (removed.length === 0) break;
        }
        putBacks++;
      }
    }

    return grid.filter(mask);
  }

  /**
   * Generates a Sudoku board with the diagonal regions randomly filled.
   * @returns {Sudoku}
   */
  static configSeed() {
    const sudoku = new Sudoku();
    sudoku._fillSections(0b100010001);
    return sudoku;
  }

  /**
   * Generates a random Sudoku configuration.
   * @param {object} options
   * @param {boolean} [options.normalize=false] (default: `false`) Whether to normalize the generated board.
   * @returns {Sudoku} A valid configuration
   */
  static generateConfig() {
    return new Sudoku().genConfig(new SearchState());
  }

  /**
   * Replaces this instance with a randomly generated Sudoku configuration.
   * @param {SearchState} search
   * @returns {Sudoku} This sudoku instance.
   */
  genConfig(search = new SearchState()) {
    this.clear();
    shuffle(DIGIT_BAG);
    DIGIT_BAG.forEach((digit, i) => this.setDigit(digit, indicesFor.region[0][i]));
    shuffle(DIGIT_BAG);
    DIGIT_BAG.forEach((digit, i) => this.setDigit(digit, indicesFor.region[4][i]));
    shuffle(DIGIT_BAG);
    DIGIT_BAG.forEach((digit, i) => this.setDigit(digit, indicesFor.region[8][i]));

    for (let ci = 0; ci < SPACES; ci++) {
      if (this._digits[ci]) continue;
      this._candidates[ci] &= ~this._cellConstraints(ci);
    }

    search.init(this);
    if (search.advanceToSolution(1)) {
      return this.copyFrom(search.solution);
    } else {
      console.error(`Something went wrong resolving config seed into solution.\nSeed: ${this.toString()}`);
      return null;
    }
  }

  /**
   * Performs a solutions search for the board and returns the first found.
   * @returns {Sudoku | null} The first solution found, or `null` if none was found.
   */
  solution() {
    const search = new SearchState();
    search.init(this);
    return search.advanceToSolution() ? new Sudoku(search.solution) : null;
  }

  /**
   * Normalizes the board by rearranging the digits so that the first row
   * contains the digits 1-9 sequentially.
   *
   * The top row needs to be fully filled for this to work.
   *
   * This will also update the clues to match the new board.
   * @returns {Sudoku} Returns itself for convenience.
   * @throws {Error} If the top row is not fully filled.
   */
  normalize() {
    if (!isAreaFull(this._digits.slice(0, DIGITS))) {
      throw new Error('Top row must be fully filled before normalizing.');
    }

    const boardCopy = this.board;
    for (let digit = 1; digit <= DIGITS; digit++) {
      const currentDigit = boardCopy[digit - 1];
      if (currentDigit !== digit) {
        swapAllInArr(boardCopy, currentDigit, digit);
      }
    }

    this.setBoard(boardCopy);

    return this;
  }

  /**
   * Returns an array of Sudokus with each possible candidate filled in at the given cell.
   *
   * If no cell index is provided, a cell with the fewest candidates will be picked.
   *
   * If there are no empty cells, an empty array is returned.
   *
   * @param {number} [emptyCellIndex=-1] (in `[0, 80]`; default: `-1`) The index of the empty cell to fill.
   * If not provided or is negative or out of bounds, a cell with the fewest candidates will be picked.
   * @returns {Sudoku[]}
   */
  _getNextsAdditive(emptyCellIndex = -1) {
    emptyCellIndex = Number(emptyCellIndex) || -1;
    if (emptyCellIndex < 0 || emptyCellIndex >= SPACES) {
      emptyCellIndex = this._pickEmptyCell();
    }

    let result = [];
    if (emptyCellIndex >= 0) {
      result = this.getCandidates(emptyCellIndex).map((candidateDigit) => {
        const next = new Sudoku(this);
        next.setDigit(candidateDigit, emptyCellIndex);
        return next;
      });
    }

    return result;
  }

  /**
   * @returns {Sudoku[]}
   */
  _getNextsSubtractive() {
    return this.board.reduce((nexts, val, i) => {
      if (val > 0) {
        const bCopy = new Sudoku(this);
        bCopy.setDigit(0, i);
        nexts.push(bCopy);
      }
      return nexts;
    }, []);
  }

  /**
   * Determines if all antiderivatives solve uniquely.
   *
   * The 'derivatives' of a puzzle is the set of puzzles that can be created
   * by removing clues.
   *
   * The 'antiderivatives' of a puzzle is the set of puzzles that can be created
   * by adding candidates to empty cells.
   * @returns {boolean} True if all antiderivative puzzles have a unique solution;
   * i.e., For every candidate of every empty cell, sets the cell to the candidate and
   * checks that the board solves uniquely.
   */
  allAntiesSolve() {
    for (let ci = 0; ci < SPACES; ci++) {
      const originalVal = this._candidates[ci];
      const originalDigit = this._digits[ci];
      // Fail fast if there are any cells with no candidates
      if (originalVal === 0) return false;
      // Skip the filled-in cells
      if (originalDigit > 0) continue;

      let count = 0;
      for (let candidateDigit of CANDIDATE_DECODINGS[originalVal]) {
        this.setDigit(candidateDigit, ci); // mutates constraints
        const flag = this.solutionsFlag();
        this.setDigit(0, ci); // undo the constraints mutation
        this._candidates[ci] = originalVal;
        this._digits[ci] = originalDigit;
        if (flag === 2) return false;
        if (flag === 1) count++;
      }
      if (count < 2) {
        console.log(`🚨 only ${count} valid options for cell ${ci}; board ${this.toString()}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Fills the given regions randomly with digits.
   * @param {number} regionMask A 9-bit mask representing which regions to fill.
   */
  _fillSections(regionMask) {
    for (let regIndex = 0; regIndex < DIGITS; regIndex++) {
      if ((regionMask & (1<<(DIGITS - 1 - regIndex))) > 0) {
        shuffle(DIGIT_BAG).forEach((digit, i) => {
          this.setDigit(digit, indicesFor.region[regIndex][i])
        });
      }
    }
  }

  /**
   * Checks whether all board values (including candidates of empty cells)
   * are the same as the given boar.d
   * @param {Sudoku} other
   * @returns {boolean}
   */
  equals(other) {
    return this._digits.every((val, i) => val === other._digits[i]);
  }

  /**
   * Performs a callback function for each solution found.
   * @param {(solution: Sudoku) => void} solutionCallback
   */
  forEachSolution(solutionCallback) {
    const puzzle = new Sudoku(this);
    puzzle._reduce();

    if (!puzzle.isValid()) return;
    if (puzzle.isSolved()) {
      solutionCallback(puzzle);
      return;
    }

    const search = new SearchState(puzzle);
    while (search.advanceToSolution()) {
      solutionCallback(new Sudoku(search.solution));
    }
  }

  /**
   * Gets the constraints for the given cell.
   * @param {number} ci
   * @returns {number} A bit mask of the constraints, where `1`
   * represents the presence of a digit in the cell's row, column, or region.
   */
  _cellConstraints(ci) {
    return Number(
      ((this._constraints[CELL_ROWS[ci]] >> (DIGITS*2)) |
      (this._constraints[CELL_COLS[ci]] >> (DIGITS)) |
      this._constraints[CELL_REGIONS[ci]]) & ALL
    );
  }

  /**
   * Adds a constraint for the given cell.
   * @param {number} ci
   * @param {number} digit
   * @returns {void}
   */
  _addConstraint(ci, digit) {
    const dMask = ENCODER[digit];
    this._constraints[CELL_ROWS[ci]] |= (dMask << (DIGITS*2));
    this._constraints[CELL_COLS[ci]] |= (dMask << DIGITS);
    this._constraints[CELL_REGIONS[ci]] |= dMask;
  }

  _removeConstraint(ci, digit) {
    // TODO Remove Hack
    // Recalculate constraints to ensure _isValid is correct
    if (!this._isValid) {
      this._resetConstraints();
      return;
    }

    const dMask = ENCODER[digit];
    this._constraints[CELL_ROWS[ci]] &= ~(dMask << (DIGITS*2));
    this._constraints[CELL_COLS[ci]] &= ~(dMask << DIGITS);
    this._constraints[CELL_REGIONS[ci]] &= ~dMask;
  }

  /**
   * Creates a new Sudoku instance from the given digits and candidates.
   *
   * @param {object} options
   * @param {number[]} options.digits
   * @param {number[]} options.candidates
   * @returns {Sudoku}
   */
  static fromState({ digits, candidates }) {
    const sudoku = new Sudoku(digits);
    sudoku._candidates = [...candidates];
    // If any cell lacks valid candidates, mark as invalid.
    if (sudoku._candidates.some((val, ci) => (~sudoku._cellConstraints(ci) & val) === 0)) {
      sudoku._isValid = false;
    }
    return sudoku;
  }

  /**
   * Sudoku Class Thing
   * @param {number[] | string | Sudoku} data
   */
  constructor(data = []) {
    /**
     * The sudoku board cell candidates, represented as an array of 9-bit masks.
     * The masks correspond to the candidate values for each cell, e.g.:
     * - `0b000000001` = 1
     * - `0b000000010` = 2
     * - `0b000000100` = 3, and so on...
     * - `0b101110111` = candidates 1, 2, 3, 5, 6, 7, 9 (no 4 or 8)
     * - `0b111111111` = all candidates (1 - 9)
     * @type {number[]}
     */
    this._candidates;

    /** @type {number[]} */
    this._digits;

    /**
     * Contains puzzle constraints in the form of 27-bit blocks,
     *
     * `[9 row bits][9 column bits][9 region bits]`,
     *
     * where each bit represents a digit, and is set to 1 if the digit
     * is present in the row, column, or region.
     *
     * Use `ROW_MASK`, `COL_MASK`, and `REGION_MASK` to filter constraint values.
     * @type {number[]}
     */
    this._constraints;

    /** Keeps track of the number of empty cells on the board.*/
    this._numEmptyCells = SPACES;

    /**
     * Tracks whether this sudoku is currently valid.
     *
     * NOTE: `true` does not mean that the puzzle is a valid sudoku; only that the puzzle
     * does not have any clashing digits. I.e., `true` does not guarantee a solution.
     *
     * However, when this is `false`, the puzzle is ***NOT*** a valid sudoku and there is no solution.
     * @type {boolean}
     */
    this._isValid = true;

    if (data instanceof Sudoku) {
      this._candidates = [...data._candidates];
      this._digits = [...data._digits];
      this._constraints = [...data._constraints];
      this._numEmptyCells = data._numEmptyCells;
      this._isValid = data._isValid;
    } else if (typeof data === 'string') {
      const parsed = Sudoku.fromString(data);
      this._candidates = [...parsed._candidates];
      this._digits = [...parsed._digits];
      this._constraints = [...parsed._constraints];
      this._numEmptyCells = parsed._numEmptyCells;
      this._isValid = parsed._isValid;
    } else if (Array.isArray(data)) {
      this._candidates = Array(SPACES).fill(ALL);
      this._digits = Array(SPACES).fill(0);
      this._constraints = Array(DIGITS).fill(0);
      if (data.length === SPACES) this.setBoard(data);
    } else {
      throw new Error(`Invalid data type: ${typeof data}`);
    }
  }

  /**
   * Copies sudoku instance data from another instance into this one.
   * @param {Sudoku} other Sudoku to copy from.
   * @returns This sudoku for convenience.
   */
  copyFrom(other) {
    this._candidates = [...other._candidates];
    this._digits = [...other._digits];
    this._constraints = [...other._constraints];
    this._numEmptyCells = other._numEmptyCells;
    this._isValid = other._isValid;
    return this;
  }

  /** Returns a copy of the board. */
  get board() {
    return [...this._digits];
  }

  /** Returns a copy of the board as a 2D array. */
  get board2D() {
    const boardRows = [];
    for (let r = 0; r < DIGITS; r++) {
      const start = r * DIGITS;
      const end = start + DIGITS;
      const rowValues = this._digits.slice(start, end);
      boardRows.push(rowValues);
    }
    return boardRows;
  }

  /** Returns the number of empty cells currently on the board. */
  get numEmptyCells() {
    return this._numEmptyCells;
  }

  get numClues() {
    return SPACES - this._numEmptyCells;
  }

  /**
   * Returns a mapping of cell indices to a count of how
   * many areas the cell is invalid in.
   */
  get cellValidityMap() {
    const v = { row: [], col: [], region: [] };
    for (let i = 0; i < DIGITS; i++) {
      v.row.push(this.isRowValid(i) ? 0 : 1);
      v.col.push(this.isColValid(i) ? 0 : 1);
      v.region.push(this.isRegionValid(i) ? 0 : 1);
    }
    return range(SPACES).map(ci => (
      v.row[CELL_ROWS[ci]] + v.col[CELL_COLS[ci]] + v.region[CELL_REGIONS[ci]]
    ));
  }

  /**
   * Sets the value of the board at the given index.
   * @param {number} digit
   * @param {number} index
   * @returns {boolean} Whether the board was modified.
   */
  setDigit(digit, index) {
    const prevDigit = this._digits[index];
    if (prevDigit === digit) return false;

    this._digits[index] = digit;
    this._candidates[index] = ENCODER[digit];

    if (prevDigit > 0) {
      this._numEmptyCells++;
      this._removeConstraint(index, prevDigit);
    }

    if (digit > 0) {
      this._numEmptyCells--;
      if (this._cellConstraints(index) & ENCODER[digit]) {
        this._isValid = false;
      }
      this._addConstraint(index, digit);
    }

    if (digit === 0) {
      // PATCHED -- Newly added logic causing incorrect solutionsFlags
      // this._candidates[index] = ALL ^ this._cellConstraints(index);
      this._candidates[index] = ALL;
    }

    return true;
  }

  /**
   * Sets the values of the board to the digits provided.
   * @param {number[]} digits
   * @returns {void}
   * @throws {Error} If the number of digits given is invalid,
   * or if any of the numbers provided are not digits.
   */
  setBoard(digits) {
    if (digits.length !== SPACES) {
      throw new Error(`board is invalid (length): ${digits.length}.`);
    }

    // TODO Maybe we don't need to do this
    // The constructor(data == Array) handles this
    this.clear();

    digits.forEach((digit, i) => {
      if (typeof digit !== 'number') {
        throw new Error(`board is invalid (type): ${typeof digit} at index ${i}.`);
      }

      if (digit < 0 || digit > DIGITS) {
        throw new Error(`board is invalid (value): ${digit} at index ${i}.`);
      }

      if (digit > 0) {
        this.setDigit(digit, i);
      }
    });
  }

  /**
   * Returns the digit at the given index.
   * @param {number} index
   * @returns {number}
   */
  getDigit(index) {
    return this._digits[index];
  }

  /**
   * Returns the current candidates for the cell at the given index.
   * @param {number} cellIndex
   * @returns {number[]}
   */
  getCandidates(cellIndex) {
    return CANDIDATE_DECODINGS[this._candidates[cellIndex]];
  }

  /**
   * Clears all values and clues on the board. The result will be completely blank.
   */
  clear() {
    this._candidates.fill(ALL);
    this._digits.fill(0);
    this._constraints.fill(0);
    this._numEmptyCells = SPACES;
  }

  /**
   * Returns the encoded board values of the given row.
   * @param {number} row
   * @returns {number[]}
   */
  rowVals(row) {
    return indicesFor.row[row].map((i) => this._digits[i]);
  }

  /**
   * Returns the encoded board values of the given column.
   * @param {number} col
   * @returns {number[]}
   */
  colVals(col) {
    return indicesFor.col[col].map((i) => this._digits[i]);
  }

  /**
   * Returns the encoded board values of the given region.
   * @param {number} reg
   * @returns {number[]}
   */
  regionVals(reg) {
    return indicesFor.region[reg].map((i) => this._digits[i]);
  }

  /**
   * Returns true if the given row is valid.
   * @param {number} row
   * @returns {boolean}
   */
  isRowValid(row) {
    return isAreaValid(this.rowVals(row));
  }

  /**
   * Returns true if the given column is valid.
   * @param {number} col
   * @returns {boolean}
   */
  isColValid(col) {
    return isAreaValid(this.colVals(col));
  }

  /**
   * Returns true if the given region is valid.
   * @param {number} reg
   * @returns {boolean}
   */
  isRegionValid(reg) {
    return isAreaValid(this.regionVals(reg));
  }

  /**
   * Returns true if the board is valid.
   * @returns {boolean}
   */
  isValid() {
    return this._isValid;
  }

  /** Returns true if the board is full. */
  isFull() {
    return this._numEmptyCells === 0;
  }

  /** Returns true if the board is full and valid. */
  isSolved() {
    if (!this.isFull()) return false;
    for (let c of this._constraints) {
      if (c !== FULL_CONSTRAINTS) return false;
    }
    return true;
  }

  /**
   * Returns whether the top row of digits is full and sequential.
   * @returns {boolean}
   */
  isNormal() {
    for (let ci = 0; ci < DIGITS; ci++) {
      const digit = decode(this._candidates[ci]);
      if (digit !== (ci + 1)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns a string representation of the board.
   * @returns {string}
   */
  toString() {
    return this._digits.join('').replace(/0/g, '.');
  }

  /**
   * Returns a multiline string representation of the board with border lines.
   * @returns {string}
   */
  toFullString() {
    return this._digits.reduce((str, val, i) => {
      str += val || '.';
      str += (((((i+1)%3) === 0) && (((i+1)%9) !== 0)) ? ' | ' : '   ');

      if (((i+1)%9) === 0) {
        str += '\n';

        if (i < 80) {
          str += ((i === 26 || i === 53) ?
            ' -----------+-----------+------------' :
            '            |           |            '
          );
          str += '\n  ';
        }
      }

      return str;
    }, '  ');
  }

  /**
   * Builds a compact string representation of this board.
   * @returns {string}
   */
  toMedString() {
    return Sudoku.toMedString(this._digits);
  }

  /**
   * Builds a compact string representation of the given board digits.
   * @param {number[]} board
   * @returns {string}
   */
  static toMedString(board) {
    return board.reduce((str, val, i) => {
      str += ((val > 0) ? val : ' ');
      if ((((i+1)%3) === 0) && (((i+1)%9) !== 0)) {
        str += '|';
      } else {
        str += ' ';
      }

      if (((i+1)%9) === 0) {
        str += '\n';

        if (i === 26 || i === 53) {
          str += '-----+-----+-----\n';
        }
      }

      return str;
    }, '');
  }

  /**
   * Normalizes sudoku board values such that the top row is in sequential order.
   * @returns {number[]} A copy of the normalized board.
   */
  get normalizedBoard() {
    const copy = [...this._digits];
    for (let i = 1; i <= DIGITS; i++) {
      const digit = copy[i - 1];
      if (digit != i) {
        swapAllInArr(copy, digit, i);
      }
    }
    return copy;
  }

  /**
   * Generates a function and a preset of operations for scrambling a Sudoku.
   */
  static createScrambler() {
    /** @type {{ i: number, j: number }[]} */
    const bands = [];
    /** @type {{ i: number, j: number }[]} */
    const stacks = [];
    /** @type {{ i: number, j: number }[]} */
    const rows = [];
    /** @type {{ i: number, j: number }[]} */
    const cols = [];
    for (let i = 2; i > 0; i--) {
      bands.push({ i, j: (Math.random() * (i+1)) | 0 });
      stacks.push({ i, j: (Math.random() * (i+1)) | 0 });

      rows.push({ i: i + 6, j: (Math.random() * (i+1)) | 0 + 6 });
      rows.push({ i: i + 3, j: (Math.random() * (i+1)) | 0 + 3 });
      rows.push({ i, j: (Math.random() * (i+1)) | 0 });

      cols.push({ i: i + 6, j: (Math.random() * (i+1)) | 0 + 6 });
      cols.push({ i: i + 3, j: (Math.random() * (i+1)) | 0 + 3 });
      cols.push({ i, j: (Math.random() * (i+1)) | 0 });
    }

    const rotations = ((Math.random() * 4) | 0);

    /** @type {number[]} */
    const order = [...shuffle(DIGIT_BAG)];

    /**
     * @param {Sudoku} sudoku
     */
    return (sudoku) => {
      bands.forEach(b => { sudoku.swapBands(b.i, b.j); });
      stacks.forEach(s => { sudoku.swapStacks(s.i, s.j); });
      rows.forEach(r => { sudoku.swapStacks(r.i, r.j); });
      cols.forEach(c => { sudoku.swapStacks(c.i, c.j); });
      for (let r = 0; r < rotations; r++) sudoku.rotate90();
      sudoku.swapAllDigits(order);
    };
  }

  /**
   * Randomly scrambles the grid.
   *
   * Note: constraints will be out of sync afterwards.
   */
  scramble() {
    Sudoku.createScrambler()(this);
  }

  /**
   * Swaps all occurrences of the given digits.
   *
   * Note: board constraints and empty cell values will be out of sync.
   *
   * @param {number} a
   * @param {number} b
   */
  swapDigits(a, b) {
    if (a < 0 || b < 0 || a > DIGITS || b > DIGITS) {
      throw new Error('given digit is out of bounds');
    }
    swapAllInArr(this._digits, a, b);

    const aEncoded = encode(a);
    const bEncoded = encode(b);
    const abEncoded = (aEncoded | bEncoded);
    for (let ci = 0; ci < SPACES; ci++) {
      // Skip if cell has both candidates
      if ((this._candidates[ci] & abEncoded) === abEncoded) continue;

      if ((this._candidates[ci] & aEncoded) > 0) {
        this._candidates[ci] &= ~aEncoded;
        this._candidates[ci] |= bEncoded;
      } else if ((this._candidates[ci] & bEncoded) > 0) {
        this._candidates[ci] &= ~bEncoded;
        this._candidates[ci] |= aEncoded;
      }
    }
  }

  /**
   * Swaps the digits in the given array with their associated indices (+ 1).
   *
   * Note: board constraints and empty cell values will be out of sync.
   *
   * @param {number[]} order
   */
  swapAllDigits(order) {
    if (!order) throw new Error('digit order not specified');
    if (order.length > DIGITS) throw new Error('order array improper length');

    order.forEach((digit, i) => {
      this.swapDigits(digit, i + 1);
    });
  }

  /**
   * Swaps digit pairs at random.
   *
   * Note: board constraints and empty cell values will be out of sync.
   */
  shuffleDigits() {
    this.swapAllDigits(shuffle(DIGIT_BAG));
  }

  /**
   * Reflects the board values over the horizontal axis.
   *
   * Note: board constraints will be out of sync.
   */
  reflectOverHorizontal() {
    reflectOverHorizontal(this._candidates, DIGITS);
    reflectOverHorizontal(this._digits, DIGITS);
  }

  /**
   * Reflects the board values over the vertical axis.
   *
   * Note: board constraints will be out of sync.
   */
  reflectOverVertical() {
    reflectOverVertical(this._candidates, DIGITS);
    reflectOverVertical(this._digits, DIGITS);
  }

  /**
   * Reflects the board values over the diagonal axis (line from bottomleft to topright).
   *
   * Note: board constraints will be out of sync.
   */
  reflectOverDiagonal() {
    reflectOverDiagonal(this._candidates);
    reflectOverDiagonal(this._digits);
  }

  /**
   * Reflects the board values over the anti-diagonal (line from topleft to bottomright).
   *
   * Note: board constraints will be out of sync.
   */
  reflectOverAntidiagonal() {
    reflectOverAntiDiagonal(this._candidates);
    reflectOverAntiDiagonal(this._digits);
  }

  /**
   * Swaps the board values such that they rotate clockwise.
   *
   * Note: board constraints will be out of sync.
   */
  rotate90() {
    rotateArr90(this._candidates);
    rotateArr90(this._digits);
  }

  /**
   * Swaps the given bands by index (0, 1, or 2).
   *
   * Note: board constraints will be out of sync.
   * @param {number} band1
   * @param {number} band2
   */
  swapBands(band1, band2) {
    Sudoku.swapBands(this._digits, band1, band2);
    Sudoku.swapBands(this._candidates, band1, band2);
  }

  /**
   * Swaps the given rows by index (0 through 8).
   *
   * Note: This may yield an invalid board unless the rows are of the same band.
   *
   * Note: board constraints will be out of sync.
   * @param {number} row1
   * @param {number} row2
   */
  swapRows(row1, row2) {
    Sudoku.swapRows(this._digits, row1, row2);
    Sudoku.swapRows(this._candidates, row1, row2);
  }

  /**
   * Swaps the given columns by index (0 through 8).
   *
   * Note: This may yield an invalid board unless the columns are of the same stack.
   *
   * Note: board constraints will be out of sync.
   * @param {number} col1
   * @param {number} col2
   */
  swapColumns(col1, col2) {
    Sudoku.swapColumns(this._digits, col1, col2);
    Sudoku.swapColumns(this._candidates, col1, col2);
  }

  /**
   * Swaps the given stacks by index (0, 1, or 2).
   *
   * Note: board constraints will be out of sync.
   * @param {number} stack1
   * @param {number} stack2
   */
  swapStacks(stack1, stack2) {
    Sudoku.swapStacks(this._digits, stack1, stack2);
    Sudoku.swapStacks(this._candidates, stack1, stack2);
  }

  /**
   * Resets the board constraints to reflec the current board values.
   *
   * This is necessary to perform before running the search algorithm to
   * ensure constraint propagation will work properly.
   */
  _resetConstraints() {
    this._constraints.fill(0);
    this._isValid = true;
    for (let i = 0; i < SPACES; i++) {
      if (this._digits[i] > 0) {
        if (this._cellConstraints(i) & this._candidates[i]) {
          this._isValid = false;
        }
        this._addConstraint(i, this._digits[i]);
      }
    }
  }

  /**
   * Resets empty cells to include all candidates.
   */
  _resetEmptyCells() {
    for (let i = 0; i < SPACES; i++) {
      if (this._digits[i] === 0) {
        this._candidates[i] = ALL;
      }
    }
  };

  /**
   * Walks the board, trying to solve for empty cells through constraint propagation.
   *
   * When finished, all cell values should have reduced to valid candidates.
   */
  _reduce(level = 1) {
    let hadReduction;
    do {
      hadReduction = false;

      // Resolves naked singles
      for (let i = 0; i < SPACES; i++) this._reduceCell(i);

      // Resolves hidden singles
      if (level >= 1) {
        for (let i = 0; i < SPACES; i++) {
          if (this._digits[i] > 0) continue;
          let uniqueCandidate = this._checkHiddenSingles(i);
          if (uniqueCandidate > 0) {
            this.setDigit(DECODER[uniqueCandidate], i);
            hadReduction = true;
          }
        }
      }
    } while (hadReduction);
  }

  /**
   * Attempts to solve a given cell or reduce its candidates.
   *
   * If successful reduced, this is recursively called for all the cell's neighbors.
   * @param {number} ci Index of cell being reduced.
   */
  _reduceCell(ci) {
    if (this._digits[ci] > 0) return false;
    const originalCandidates = this._candidates[ci];
    this._candidates[ci] &= ~this._cellConstraints(ci);

    // If there are no more candidates for the cell, the board is invalid.
    if (this._candidates[ci] <= 0) {
      this._isValid = false;
      this.setDigit(0, ci);
      return false;
    }

    const d = decode(this._candidates[ci]);
    if (d > 0) this.setDigit(d, ci);

    // Propagate to neighboring cells if there was any reduction to the cell.
    if (this._candidates[ci] < originalCandidates) {
      for (let ni of CELL_NEIGHBORS[ci]) {
        if (this._digits[ni] === 0) this._reduceCell(ni);
      }
    }
  };

  /**
   * Attempts to reduce the candidates of the given cell.
   * Does nothing if the cell contains a digit.
   * If reducing removes all candidates, marks the sudoku as invalid.
   * If a single candidate remains, this will NOT set the cell digit.
   * @param {number} ci cell index
   */
  reduceCandidates(ci) {
    if (this._digits[ci] > 0) return;
    this._candidates[ci] &= ~this._cellConstraints(ci);
    if (this._candidates[ci] <= 0) this._isValid = false;
  };

  /**
   * Checks if the given cell contains a candidate unique to its
   * row, column, or region.
   * @param {number} ci Index of cell being checked.
   * @returns {number} The unique candidate digit; or 0 if none.
   */
  _checkHiddenSingles(ci) {
    for (let candidate of CANDIDATES[this._candidates[ci]]) {
      let unique = true;
      for (let ni of ROW_NEIGHBORS[ci]) {
        if (this._candidates[ni] & candidate) {
          unique = false;
          break;
        }
      }
      if (unique) return candidate;

      unique = true;
      for (let ni of COL_NEIGHBORS[ci]) {
        if (this._candidates[ni] & candidate) {
          unique = false;
          break;
        }
      }
      if (unique) return candidate;

      unique = true;
      for (let ni of REGION_NEIGHBORS[ci]) {
        if (this._candidates[ni] & candidate) {
          unique = false;
          break;
        }
      }
      if (unique) return candidate;
    }

    return 0;
  }

  /**
   * Finds the index of an empty cell which contains the fewest candidates.
   * @return {number} Cell index, or `-1` if there are no empty cells.
   */
  _pickEmptyCell() {
    if (this._numEmptyCells === 0) return -1;
    if (this._numEmptyCells === SPACES) return Math.trunc(Math.random() * SPACES);

    // TODO Keep track of empty cells in state for instant lookup.
    let minNumCandidates = DIGITS + 1;
    let _minimums = [];
    for (let ci = 0; ci < SPACES; ci++) {
      if (this._digits[ci] === 0) {
        const numCandidates = BIT_COUNT_MAP[this._candidates[ci]];
        if (numCandidates < minNumCandidates) {
          minNumCandidates = numCandidates;
          _minimums = [ci];
        } else if (numCandidates === minNumCandidates) {
          _minimums.push(ci);
        }
      }
    }

    return _minimums.length ? chooseRandom(_minimums) : -1;
  }

  /**
   * Determines whether this puzzle has a single solution.
   * @returns {boolean} True if the puzzle has a unique solution; otherwise false.
   */
  hasUniqueSolution() {
    return this.solutionsFlag() === 1;
  }

  /**
   * Performs a solution search and returns a value indicating the number of solutions.
   *
   * The search will stop early if a second solution is found. Otherwise, the search will
   * will continue until the entire search space is checked.
   *
   * Note: If the board has fewer than the minimum `17` clues, then this returns `2` automatically.
   * @returns {number} Value indicating the number of solutions:
   * - `0` - No solution.
   * - `1` - A single solution.
   * - `2 or higher` - Multiple solutions.
   */
  solutionsFlag() {
    if (!this.isValid()) return 0;
    if (this.numEmptyCells > (SPACES - MIN_CLUES)) return 3;
    if (BIT_COUNT_MAP[this.digitsUsed()] < 8) return 4;

    const search = new SearchState(this);
    while (search.numSolutions < 2 && search.advanceToSolution());
    return search.numSolutions;
  }

  /**
   * Counts and returns the number of solutions for this puzzle.
   * Note: This performs a full depth-first search.
   */
  solutionCount() {
    const search = new SearchState(this);
    while (search.advanceToSolution());
    return search.numSolutions;
  }

  /**
  * Returns a mask of the differences between this config and another.
  * @param {Sudoku} config
  * @returns {bigint}
  */
  diff(config) {
    const a = this.board;
    const b = config.board;
    let mask = 0n;
    for (let ci = 0; ci < SPACES; ci++) {
      if (a[ci] !== b[ci]) {
        mask |= CELL_MASKS[ci];
      }
    }
    return mask;
  }

  /** Gets the grid's fingerprint using the digitCombos algorithm, level 2. */
  dc2() {
    const sieve = new SudokuSieve({ config: this });
    return this._fp(sieve, 2, sieve.getDigitComboMasks(2));
  }
  /** Gets the grid's fingerprint using the digitCombos algorithm, level 3. */
  dc3() {
    const sieve = new SudokuSieve({ config: this });
    return this._fp(sieve, 3, sieve.getDigitComboMasks(3));
  }
  /** Gets the grid's fingerprint using the digitCombos algorithm, level 4. */
  dc4() {
    const sieve = new SudokuSieve({ config: this });
    return this._fp(sieve, 4, sieve.getDigitComboMasks(4));
  }
  /**
   * Gets the grid's fingerprint using the digitCombos algorithm
   * with the specified level.
   * @param {number} level
   */
  dc(level) {
    const sieve = new SudokuSieve({ config: this });
    return this._fp(sieve, level, sieve.getDigitComboMasks(level));
  }
  /** Gets the grid's fingerprint using the fullCombos algorithm, level 2. */
  fp2() {
    const sieve = new SudokuSieve({ config: this });
    return this._fp(sieve, 2, sieve.getFullComboMasks(2));
  }
  /** Gets the grid's fingerprint using the fullCombos algorithm, level 3. */
  fp3() {
    const sieve = new SudokuSieve({ config: this });
    return this._fp(sieve, 3, sieve.getFullComboMasks(3));
  }
  /** Gets the grid's fingerprint using the fullCombos algorithm, level 4. */
  fp4() {
    const sieve = new SudokuSieve({ config: this });
    return this._fp(sieve, 4, sieve.getFullComboMasks(4));
  }
  /**
   * Gets the grid's fingerprint using the fullCombos algorithm
   * with the specified level.
   * @param {number} level
   */
  fp(level) {
    const sieve = new SudokuSieve({ config: this });
    return this._fp(sieve, level, sieve.getFullComboMasks(level));
  }
  /**
   * Helper for seeding sieve with masks and building fingerprint string.
   * @param {SudokuSieve} sieve
   * @param {number} level
   * @param {bigint[]} masks
   * @returns {string}
   */
  _fp(sieve, level, masks) {
    if (!this.isSolved()) throw new Error('Invalid configuration.');
    if (level < 2 || level > 4) throw new Error('Unsupported level. [2 <= level <= 4]');

    sieve.seedFromMasks(masks);

    let minM = SPACES;
    let maxM = 0;
    /** @type {number[]} */
    const itemsByM = Array(SPACES).fill(0);
    sieve.items.forEach(item => {
      const count = countBigBits(item);
      itemsByM[count]++;
      if (count < minM) minM = count;
      if (count > maxM) maxM = count;
    });

    let items = itemsByM.slice(minM, maxM + 1).map(count => (count > 0) ? `${count.toString(16)}` : '');
    if (level === 2) {
      items = items.filter((_, i) => (i % 2) === 0);
    }

    return items.join(':');
  }

  /**
   * *WORK IN PROGRESS* -- This function is experimental and will be
   * replaced in the future. It's not an accurate ranking for medium/hard puzzles
   * and is very expensive to calculate.
   *
   * Indicates the difficulty of this sudoku.
   * Invalid puzzles, or puzzles with
   * @returns {number}
   */
  difficulty() {
    const root = new Sudoku(this);
    root._resetEmptyCells();
    root._resetConstraints();
    root._reduce();

    let diff = 1;

    if (root.isSolved()) return diff;
    if (!root.isValid()) return -1;

    /**
     * @typedef {Object} Nodey
     * @property {Sudoku} sudoku
     * @property {number} difficulty
     */

    /** @type {Nodey[]} */
    const queue = [{ sudoku: root, difficulty: 1 }];
    const diffs = [];
    let solution = null;

    while (queue.length > 0) {
      const node = queue.shift();
      const sudoku = node.sudoku;
      if (sudoku.isSolved()) {
        if (!solution) {
          solution = sudoku.toString();
        } else if (sudoku.toString() !== solution) {
          return -1;
        }
        // return node.difficulty;
        diffs.push(node.difficulty);
      }

      // Get all empty cells of minimum candidates
      let minNumCandidates = DIGITS + 1;
      let candyBucket = [];
      sudoku._candidates.forEach((candidates, ci) => {
        const numCandidates = BIT_COUNT_MAP[candidates];
        if (numCandidates > 1) {
          if (numCandidates < minNumCandidates) {
            minNumCandidates = numCandidates;
            candyBucket = [ci];
          } else if (numCandidates === minNumCandidates) {
            candyBucket.push(ci);
          }
        }
      });

      // For each empty cell collected, create nodes for each candidate
      candyBucket.forEach(emptyCi => {
        CANDIDATE_DECODINGS[sudoku._candidates[emptyCi]].forEach(digit => {
          const nextSudoku = new Sudoku(sudoku);
          nextSudoku.setDigit(digit, emptyCi);
          nextSudoku._reduce();
          queue.push({ sudoku: nextSudoku, difficulty: (node.difficulty + 1) });
        });
      });

      // Priority queue hack
      queue.sort((a, b) => (a.difficulty - b.difficulty));
    }

    if (diffs.length === 0) return -1;
    return diffs.reduce((acc, d) => (acc + d), 0) / diffs.length;
  }

  /**
   * Continuously removes digits from the board at random,
   * until the board is as empty as possible without becoming unsolvable. This method
   * modifies the current Sudoku instance.
   *
   * @returns {boolean} Whether the sudoku instance was changed as a result of shaking.
   */
  shake() {
    // If this grid does not have a unique solution, return immediately.
    if (!this.hasUniqueSolution()) return false;

    let removedCount = 0;
    const clonedSudoku = new Sudoku(this);
    shuffle(range(SPACES)).forEach((ci) => {
      // Skip if the cell is already empty.
      if (this._digits[ci] === 0) return;

      // Attempt to remove cell on the clone.
      clonedSudoku.setDigit(0, ci);
      if (clonedSudoku.hasUniqueSolution()) {
        this.setDigit(0, ci);
        removedCount++;
      }
      clonedSudoku.copyFrom(this);
    });

    return removedCount > 0;
  }

  /**
   * Builds a random palindrome mask with the given bitCount.
   * @param {number} bitCount
   */
  static randomPalindrome(bitCount) {
    const n = 40;
    if (bitCount < 0 || bitCount > SPACES) {
      throw new Error(`bitCount out of range: ${bitCount}; (min: 0, max: ${SPACES})`);
    }
    const k = (bitCount / 2) | 0;
    const rLimit = NCK(n, k);
    return Sudoku.palindrome(bitCount, randomBig(rLimit));
  }

  /**
   * Builds the r'th palindrome mask with the given bitCount.
   * The binary of the returned uint_81 will read as a palindrome.
   * @param {number} bitCount
   * @param {bigint} r A number between 0 and (40 choose bitCount/2).
   * @returns {bigint}
   */
  static palindrome(bitCount, r) {
    const n = 40;
    // Validate bitCount and r
    if (bitCount < 0 || bitCount > SPACES) {
      throw new Error(`bitCount out of range: ${bitCount}; (min: 0, max: ${SPACES})`);
    }
    const k = (bitCount / 2) | 0;
    const nck = NCK(n, k);
    if (r < 0n) throw new Error(`r must be nonnegative.`);
    if (r >= nck) throw new Error(`r too large; (max: ${nck})`);

    let bc = 0n;
    let _r = Number(r);

    for (let _n = n - 1, _k = k - 1; _n >= 0 && _k >= 0; _n--) {
      const _nck = NCK(_n, _k);
      if (_r < _nck) {
        bc |= CELL_MASK_COMPLEMENTS[_n];
        _k--;
      } else {
        _r -= _nck;
      }
    }

    // If bitCount is odd, set the middle bit (40).
    if ((bitCount % 2) > 0) {
      bc |= (1n << 40n);
    }

    return bc;
  }

  /**
   *
   * @returns {number} Encoded number indicating which digits are in use in this grid.
   */
  digitsUsed() {
    let ds = 0;
    let bc = 0;
    for (let ci = 0; ci < SPACES & bc < 9; ci++) {
      const d = this._digits[ci];
      if (d > 0 && (ds & ENCODER[d]) === 0) {
        ds |= ENCODER[d];
        bc++;
      }
    }
    return ds;
  }
}

export default Sudoku;
