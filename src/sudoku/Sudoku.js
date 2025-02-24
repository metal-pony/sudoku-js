import {
  range,
  rotateArr90,
  reflectOverHorizontal,
  reflectOverVertical,
  reflectOverDiagonal,
  reflectOverAntiDiagonal,
  shuffle,
  swapAllInArr,
  swap
} from '../util/arrays.js';
import { randomBitCombo } from '../util/perms.js';
import Debugger from '../util/debug.js';
import SudokuSieve, { searchForItemsFromMask, seedSieve } from './SudokuSieve.js';
import { chooseRandom, countBigBits, countBits, removeRandom } from '../util/common.js';

const debug = new Debugger(false);

/**
 * @callback SolutionFoundCallback
 * @param {Sudoku} sudoku
 * @returns {boolean} If `true`, the search will continue for more solutions.
 */

export const RANK = 3;
/** The number of digits used in sudoku.*/
export const DIGITS = RANK * RANK;
/** `0x1ff`; Represents the combination of all candidates for a given cell on a sudoku board.*/
const ALL = (1 << DIGITS) - 1;
/** The number of spaces on a sudoku board.*/
export const SPACES = DIGITS * DIGITS;
/** The minimum number of clues required for a sudoku puzzle.*/
export const MIN_CLUES = DIGITS * 2 - 1;

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

/**
 * Encodes a cell index as an 81-bit mask.
 *
 * Note: The leftmost mask bits correspond with the top-left sudoku board cell.
 *
 * Example: `cellmask(0) => 0b1000000...000`
 *
 * Example: `cellmask(80) => 0b1000000...000`
 * @param {number} cellIndex `[0, 80]`; ⚠️ not checked.
 */
export const cellMask = (cellIndex) => (1n << (BigInt(SPACES - cellIndex - 1)));

/**
 * Encodes a digit as a 9-bit mask.
 *
 * Note: The higher order bits correspond with higher digit values.
 *
 * Example:
 *
 * `digitMask(2) => 0b000000010`
 *
 * `digitMask(9) => 0b100000000`
 * @param {number} digit `[1, 9]`; ⚠️ not checked.
 */
export const digitMask = (digit) => (1 << (digit - 1));

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

const CELL_MASKS = range(SPACES).map(cellMask);

/** @type {number[]} */
const EMPTY_BOARD = Array(SPACES).fill(ALL);

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
 * @returns {number}
 */
export const encode = (digit) => ENCODER[digit];

/**
 * Decodes an encoded value.
 * @param {number} encoded
 * @returns {number}
 */
export const decode = (encoded) => DECODER[encoded];

/**
 * Returns whether the given encoded value represents a digit.
 * @param {number} encoded
 * @returns {boolean}
 */
export const isDigit = (encoded) => DECODER[encoded] > 0;

/**
 * Returns the row index of the given cell.
 * @param {number} cellIndex
 * @returns {number}
 */
export const cellRow = (cellIndex) => (cellIndex / DIGITS) | 0;

/**
 * Returns the column index of the given cell.
 * @param {number} cellIndex
 * @returns {number}
 */
export const cellCol = (cellIndex) => cellIndex % DIGITS;

/**
 * Returns the region index of the given cell.
 * @param {number} cellIndex
 * @returns {number}
 */
export const cellRegion = (cellIndex) => ((cellIndex / 27) | 0) * 3 + (((cellIndex % 9) / 3) | 0);

/**
 * Returns the region index of the given cell.
 * @param {number} row
 * @param {number} col
 * @returns {number}
 */
export const cellRegion2D = (row, col) => ((row / 3) | 0) * 3 + ((col / 3) | 0);

/** Maps cell indices to rows. */
const CELL_ROWS = range(SPACES).map(cellRow);
/** Maps cell indices to columns. */
const CELL_COLS = range(SPACES).map(cellCol);
/** Maps cell indices to regions. */
const CELL_REGIONS = range(SPACES).map(cellRegion);
/** Maps cell indices to cell indices of row neighbors. Excludes itself. */
const ROW_NEIGHBORS = range(SPACES).map((ci) => indicesFor.row[CELL_ROWS[ci]].filter(i => i !== ci));
/** Maps cell indices to cell indices of column neighbors. Excludes itself. */
const COL_NEIGHBORS = range(SPACES).map((ci) => indicesFor.col[CELL_COLS[ci]].filter(i => i !== ci));
/** Maps cell indices to cell indices of region neighbors. Excludes itself. */
const REGION_NEIGHBORS = range(SPACES).map((ci) => indicesFor.region[CELL_REGIONS[ci]].filter(i => i !== ci));
/** Maps cell indices to cell indices of row, column, and region neighbors. Excludes itself. */
const CELL_NEIGHBORS = range(SPACES).map((ci) => {
  const neighbors = new Set();
  ROW_NEIGHBORS[ci].forEach(n => neighbors.add(n));
  COL_NEIGHBORS[ci].forEach(n => neighbors.add(n));
  REGION_NEIGHBORS[ci].forEach(n => neighbors.add(n));
  return [...neighbors];
});

/**
 * Returns whether an area on a Sudoku board (row, column, or region)
 * is valid given the encoded values of the cells that make up the area.
 * @param {number[]} areaVals
 * @returns {boolean}
 */
function isAreaValid(areaVals) {
  let reduced = 0;
  const vals = areaVals.filter(isDigit);
  for (let vi = 0; vi < vals.length; vi++) {
    const val = vals[vi];
    if ((reduced & val) > 0) {
      return false;
    }
    reduced |= val;
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
const isAreaFull = (areaVals) => areaVals.every(isDigit);

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

/**
 * Represents a Sudoku board.
 */
export class Sudoku {
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
      board._clues[index] = digit;
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

    // let _board = [...EMPTY_BOARD];
    // puzzleStack.push(rootNode);

    let numPops = 0; // Number of pops. If the search resets, so does this.

    while (puzzleStack.length > 0 && numPops < maxPops) {
      const puzzleNode = puzzleStack[puzzleStack.length - 1]; // peek
      const puzzle = puzzleNode.sudoku;
      puzzleNode.visit();
      debug.log(`generatePuzzle> (empty: ${puzzle.numEmptyCells}) ${puzzle.toString()}`);

      // _board = puzzle.encodedBoard;
      if (!puzzle.hasUniqueSolution()) {
        debug.log(`generatePuzzle> no unique solution, popping...`);
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
        debug.log(`generatePuzzle> found puzzle with ${puzzle.numEmptyCells} empty cells`);
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

    const puzzle = puzzleStack[puzzleStack.length - 1].sudoku;
    puzzle._clues = puzzle.board;
    return puzzle;
  }

  /**
   *
   * @param {bigint} mask 81 or less length bit mask, where 1s represent cells to keep.
   * @returns {Sudoku}
   */
  filter(mask) {
    return new Sudoku(this.board.map((d, i) => (
      (mask & (1n << BigInt(SPACES - i - 1))) === 0n ? 0 : d)
    ));
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
   * @param {number} options.timeoutMs
   * @returns {Sudoku | null}
   */
  static generatePuzzle2({
    grid = Sudoku.generateConfig(),
    numClues = 32,
    sieve = [],
    timeoutMs = 0
  }) {
    if (numClues < MIN_CLUES || numClues > SPACES) return null;
    if (numClues === SPACES) return new Sudoku(grid);
    if (!grid) throw new new Error('Must provide solution grid');
    if (!(grid instanceof Sudoku) || !grid.isSolved())
      throw new Error('Solution grid is invalid');

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

        // Check if mask still satisfies sieve
        let satisfies = true;
        for (const item of sieve) {
          if ((item & ~mask) === item) {
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
          if (timeoutMs > 0 && (maskFails % 100) === 0) {
            if ((Date.now() - start) > timeoutMs) {
              return null;
            }
          }

          continue;
        }

        if (grid.filter(mask).solutionsFlag() !== 1) {
          puzzleCheckFails++;
          if (puzzleCheckFails === 1000 && sieve.length < 36) {
            seedSieve({ grid, sieve, level: 2 });
          } else if (puzzleCheckFails === 2500 && sieve.length < 200) {
            seedSieve({ grid, sieve, level: 3 });
          } else if (puzzleCheckFails > 10000 && sieve.length < 1000) {
            searchForItemsFromMask(grid, sieve, mask, true);
          }

          mask |= cellMask(choice);
          continue;
        }

        removed.push(choice);
        remaining.splice(i, 1);
        i--;
      }

      // If no cells were chosen
      // - Put some cells back and try again
      if (remaining.length === startChoices) {
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
  static generateConfig({ normalize } = { normalize: false }) {
    const config = Sudoku.configSeed().firstSolution();
    config._clues = config.board;
    return (normalize) ? config.normalize() : config;
  }

  /**
   * Performs a solutions search for the board and returns the first found.
   * @param {object} options
   * @returns {Sudoku | null} The first solution found, or `null` if none was found.
   */
  firstSolution() {
    let result = null;
    this.searchForSolutions2({
      solutionFoundCallback: (solution) => {
        result = solution;
        return false;
      }
    });
    return result;
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
    if (!isAreaFull(this.rowVals(0))) {
      throw new Error('Top row must be fully filled before normalizing.');
    }

    const boardCopy = this.board;
    for (let digit = 1; digit <= DIGITS; digit++) {
      const currentDigit = boardCopy[digit - 1];
      if (currentDigit !== digit) {
        swapAllInArr(boardCopy, currentDigit, digit);
      }
    }

    this._clues = this._clues.map((digit, ci) => ((digit > 0) ? boardCopy[ci] : 0));
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
    let digit = 0;
    for (let ci = 0; ci < SPACES; ci++) {
      const originalVal = this._board[ci];
      if (originalVal === 0) {
        return false;
      }

      digit = decode(originalVal);
      if (digit === 0) {
        for (const candidateDigit of CANDIDATE_DECODINGS[originalVal]) {
          const originalVal = this._board[ci];
          this.setDigit(candidateDigit, ci); // mutates constraints
          const flag = this.solutionsFlag();
          this.setDigit(0, ci); // undo the constraints mutation
          this._board[ci] = originalVal;
          if (flag !== 1) {
            return false;
          }
        }
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
    return this.board.every((val, i) => val === other.board[i]);
  }

  /**
   * Performs a depth-first search for sudoku solution(s) of the given board.
   * The given callback function is triggered when a solution is found. If the callback
   * returns `false`, the search will stop;
   * otherwise it will continue searching for solutions.
   *
   * @param {object} options
   * @param {(solution: Sudoku) => boolean} [options.solutionFoundCallback] Called with a solution when one is found.
   * If the callback returns truthy, the search will continue.
   */
  searchForSolutions2({
    solutionFoundCallback = (solution) => true
  }) {
    const root = new Sudoku(this);
    root._resetEmptyCells();
    root._resetConstraints();
    root._reduce();

    if (root.isSolved()) {
      if (solutionFoundCallback) {
        solutionFoundCallback(root);
        return;
      }
    }

    if (!root._isValid) {
      return;
    }

    /**
     * @typedef {Object} Nodey
     * @property {Sudoku} sudoku
     * @property {number} emptyCellIndex
     * @property {() => Nodey | null} next
     */

    /**
     *
     * @param {Sudoku} sudoku
     * @return {Nodey}
     */
    const Nodey = (sudoku) => {
      // sudoku._reduce();
      const emptyCellIndex = sudoku._pickEmptyCell();

      return ({
        /** @type {Sudoku} */
        sudoku,
        emptyCellIndex,
        emptyCellCandidatesEncoded: (emptyCellIndex >= 0) ? sudoku._board[emptyCellIndex] : 0,

        /** @return {Nodey | null} */
        next() {
          if (this.emptyCellCandidatesEncoded === 0 || !this.sudoku._isValid) {
            return null;
          }

          const s = new Sudoku(this.sudoku);
          const randomCandidateDigit = chooseRandom(CANDIDATE_DECODINGS[this.emptyCellCandidatesEncoded]);
          s.setDigit(randomCandidateDigit, this.emptyCellIndex);
          for (let ni of CELL_NEIGHBORS[this.emptyCellIndex]) s._reduce2(ni);
          this.emptyCellCandidatesEncoded &= ~(ENCODER[randomCandidateDigit])
          return Nodey(s);
        }
      });
    };

    /** @type {Nodey[]} */
    let stack = [Nodey(root)];

    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      const sudoku = top.sudoku;

      if (sudoku.isSolved()) {
        stack.pop();
        if (Boolean(solutionFoundCallback(sudoku))) {
          continue;
        } else {
          break;
        }
      }

      const next = top.next();
      if (next === null) {
        stack.pop();
      } else {
        stack.push(next);
      }
    }

    return;
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
    const dMask = ENCODER[digit];
    this._constraints[CELL_ROWS[ci]] &= ~(dMask << (DIGITS*2));
    this._constraints[CELL_COLS[ci]] &= ~(dMask << DIGITS);
    this._constraints[CELL_REGIONS[ci]] &= ~dMask;
  }

  /**
   * Sudoku Class Thing
   * @param {number[] | string | Sudoku} data
   */
  constructor(data = []) {
    /**
     * The Sudoku board, represented as an array of bit masks, each a length of `NUM_DIGITS` bits.
     * The masks correspond to the candidate values for each cell, e.g.:
     * - `0b000000001` = 1
     * - `0b000000010` = 2
     * - `0b000000100` = 3, and so on...
     * - `0b101110111` = candidates 1, 2, 3, 5, 6, 7, 9 (no 4 or 8)
     * - `0b111111111` = all candidates (1 - 9)
     * @type {number[]}
     */
    this._board;

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

    /**
     * The initial clues on the board.
     * @type {number[]}
     */
    this._clues;

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
      this._board = [...data._board];
      this._constraints = [...data._constraints];
      this._clues = data.board;
      this._numEmptyCells = data._numEmptyCells;
      this._isValid = data._isValid;
    } else if (typeof data === 'string') {
      const parsed = Sudoku.fromString(data);
      this._board = [...parsed._board];
      this._constraints = [...parsed._constraints];
      this._clues = parsed.clues;
      this._numEmptyCells = parsed._numEmptyCells;
    } else if (Array.isArray(data)) {
      this._board = [...EMPTY_BOARD];
      this._constraints = Array(DIGITS).fill(0);
      if (data.length === SPACES) {
        this.setBoard(data);
      }
      this._clues = this.board;
    } else {
      throw new Error(`Invalid data type: ${typeof data}`);
    }
  }

  /**
   * Returns a copy of the board.
   * @returns {number[]}
   */
  get board() {
    return this._board.map(decode);
  }

  /**
   * Returns a copy of the board as a 2D array.
   * @returns {number[][]}
   */
  get board2D() {
    const boardRows = [];
    for (let r = 0; r < DIGITS; r++) {
      const start = r * DIGITS;
      const end = start + DIGITS;
      const rowValues = this.board.slice(start, end);
      boardRows.push(rowValues);
    }
    return boardRows;
  }

  /**
   * Returns the initial clues on the board.
   * @returns {number[]}
   */
  get clues() {
    return [...this._clues];
  }

  /**
   * Returns the number of empty cells currently on the board.
   * @returns {number}
   */
  get numEmptyCells() {
    return this._numEmptyCells;
  }

  /**
   * Returns whether the cell at the given index was given as a clue.
   * @param {number} cellIndex
   * @returns {boolean}
   */
  isClue(cellIndex) {
    return this._clues[cellIndex] > 0;
  }

  /**
   * Sets the value of the board at the given index.
   * @param {number} digit
   * @param {number} index
   * @returns {void}
   */
  setDigit(digit, index) {
    const prevVal = this._board[index];
    const newVal = encode(digit);
    this._board[index] = newVal;

    if (isDigit(prevVal) && !isDigit(newVal)) {
      this._numEmptyCells++;
      this._removeConstraint(index, decode(prevVal));
    } else if (!isDigit(prevVal) && isDigit(newVal)) {
      this._numEmptyCells--;
      this._addConstraint(index, digit);
    } else if (isDigit(prevVal) && isDigit(newVal)) {
      // If both the previous and new values are digits, then the
      // constraint for the previous value is removed and the
      // constraint for the new value is added.
      this._removeConstraint(index, decode(prevVal));
      this._addConstraint(index, digit);
    }
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
    this._numEmptyCells = SPACES;
    this._board.fill(ALL);
    this._constraints.fill(0);

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
    return decode(this._board[index]);
  }

  /**
   * Returns the current candidates for the cell at the given index.
   * @param {number} cellIndex
   * @returns {number[]}
   */
  getCandidates(cellIndex) {
    return CANDIDATE_DECODINGS[this._board[cellIndex]];
  }

  /**
   * Clears all values and clues on the board. The result will be completely blank.
   */
  clear() {
    this._board.fill(ALL);
    this._constraints.fill(0);
    this._clues.fill(0);
    this._numEmptyCells = SPACES;
  }

  /**
   * Resets the board to its initial clues.
   */
  reset() {
    this._board.fill(ALL);
    this._constraints.fill(0);
    this._numEmptyCells = SPACES;
    this._clues.forEach((digit, index) => this.setDigit(digit, index));
  }

  /**
   * Returns the encoded board values of the given row.
   * @param {number} row
   * @returns {number[]}
   */
  rowVals(row) {
    return indicesFor.row[row].map((i) => this._board[i]);
  }

  /**
   * Returns the encoded board values of the given column.
   * @param {number} col
   * @returns {number[]}
   */
  colVals(col) {
    return indicesFor.col[col].map((i) => this._board[i]);
  }

  /**
   * Returns the encoded board values of the given region.
   * @param {number} reg
   * @returns {number[]}
   */
  regionVals(reg) {
    return indicesFor.region[reg].map((i) => this._board[i]);
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
    // TODO Check constraints instead
    return range(DIGITS).every((i) => (
      this.isRowValid(i) &&
      this.isColValid(i) &&
      this.isRegionValid(i)
    ));
  }

  /** Returns true if the board is full. */
  isFull() { return this._numEmptyCells === 0; }

  /**
   * Returns true if the board is full and valid.
   * @returns {boolean}
   */
  isSolved() {
    return this._numEmptyCells === 0 && this._constraints.every((c) => c === FULL_CONSTRAINTS);
  }

  /**
   * Returns whether the board is a valid Sudoku configuration (i.e. full and valid by the rules of Sudoku).
   * @alias Sudoku#isSolved
   * @returns {boolean}
   */
  isConfig() {
    return this.isSolved();
  }

  /**
   * Returns whether the top row of digits is full and sequential.
   * @returns {boolean}
   */
  isNormal() {
    for (let ci = 0; ci < DIGITS; ci++) {
      const digit = decode(this._board[ci]);
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
    return this.board.join('').replace(/0/g, '.');
  }

  /**
   * Returns a multiline string representation of the board with border lines.
   * @returns {string}
   */
  toFullString() {
    return this._board.reduce((str, val, i) => {
      str += isDigit(val) ? decode(val) : '.';
      str += (((((i+1)%3) === 0) && (((i+1)%9) !== 0)) ? ' | ' : '   ');

      if (((i+1)%9) === 0) {
        str += '\n';

        if (i < 80) {
          str += ((((Math.floor((i+1)/9)%3) == 0) && ((Math.floor(i/9)%8) != 0)) ?
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
   * Normalizes sudoku board values such that the top row is in sequential order.
   * @returns {number[]} A copy of the normalized board.
   */
  get normalizedBoard() {
    const copy = [...this.board];
    for (let i = 1; i <= DIGITS; i++) {
      const digit = copy[i - 1];
      if (digit != i) {
        swapAllInArr(copy, digit, i);
      }
    }
    return copy;
  }

  /**
   * Swaps all digits with another digit at random.
   * Akin to colors on a rubix cube.
   *
   * Note: board constraints and empty cell values will be out of sync.
   */
  shuffleDigits() {
    const digits = range(DIGITS + 1, 1);
    shuffle(digits).forEach((digit, i) => {
      swapAllInArr(this._board, encode(digit), encode(i + 1));
      swapAllInArr(this._clues, digit, i + 1);
    });
  }

  /**
   * Reflects the board values over the horizontal axis.
   *
   * Note: board constraints will be out of sync.
   */
  reflectOverHorizontal() {
    reflectOverHorizontal(this._board, DIGITS);
    reflectOverHorizontal(this._clues, DIGITS);
  }

  /**
   * Reflects the board values over the vertical axis.
   *
   * Note: board constraints will be out of sync.
   */
  reflectOverVertical() {
    reflectOverVertical(this._board, DIGITS);
    reflectOverVertical(this._clues, DIGITS);
  }

  /**
   * Reflects the board values over the diagonal axis (line from bottomleft to topright).
   *
   * Note: board constraints will be out of sync.
   */
  reflectOverDiagonal() {
    reflectOverDiagonal(this._board);
    reflectOverDiagonal(this._clues);
  }

  /**
   * Reflects the board values over the anti-diagonal (line from topleft to bottomright).
   *
   * Note: board constraints will be out of sync.
   */
  reflectOverAntidiagonal() {
    reflectOverAntiDiagonal(this._board);
    reflectOverAntiDiagonal(this._clues);
  }

  /**
   * Swaps the board values such that they rotate clockwise.
   *
   * Note: board constraints will be out of sync.
   */
  rotate90() {
    rotateArr90(this._board);
    rotateArr90(this._clues);
  }

  /**
   * Swaps the given bands by index (0, 1, or 2).
   *
   * Note: board constraints will be out of sync.
   * @param {number} band1
   * @param {number} band2
   */
  swapBands(band1, band2) {
    const b1 = band1 % 3;
    const b2 = band2 % 3;
    if (b1 === b2) {
      return;
    }

    const N = DIGITS * 3;
    const bands = [
      this._board.slice(0, N),
      this._board.slice(N, N*2),
      this._board.slice(N*2, N*3)
    ];
    const clues = [
      this._clues.slice(0, N),
      this._clues.slice(N, N*2),
      this._clues.slice(N*2, N*3),
    ];

    swap(bands, b1, b2);
    swap(clues, b1, b2);
    this._board = bands.flat();
    this._clues = clues.flat();
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
    const r1 = row1 % DIGITS;
    const r2 = row2 % DIGITS;
    if (r1 === r2) {
      return;
    }

    const N = DIGITS;
    const rows = range(DIGITS).map(i => this._board.slice(N*i, N*(i+1)));
    const clueRows = range(DIGITS).map(i => this._clues.slice(N*i, N*(i+1)));
    swap(rows, r1, r2);
    swap(clueRows, r1, r2);
    this._board = rows.flat();
    this._clues = clueRows.flat();
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
    const c1 = col1 % DIGITS;
    const c2 = col2 % DIGITS;
    if (c1 === c2) {
      return;
    }

    let temp;
    for (let r = 0; r < DIGITS; r++) {
      temp = this._board[r * DIGITS + c1];
      this._board[r * DIGITS + c1] = this._board[r * DIGITS + c2];
      this._board[r * DIGITS + c2] = temp;

      temp = this._clues[r * DIGITS + c1];
      this._clues[r * DIGITS + c1] = this._clues[r * DIGITS + c2];
      this._clues[r * DIGITS + c2] = temp;
    }
  }

  /**
   * Swaps the given stacks by index (0, 1, or 2).
   *
   * Note: board constraints will be out of sync.
   * @param {number} stack1
   * @param {number} stack2
   */
  swapStacks(stack1, stack2) {
    const s1 = stack1 % 3;
    const s2 = stack2 % 3;
    if (s1 === s2) {
      return;
    }

    this.swapColumns(s1*3, s2*3);
    this.swapColumns(s1*3 + 1, s2*3 + 1);
    this.swapColumns(s1*3 + 2, s2*3 + 2);
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
    this.board.forEach((digit, i) => {
      if (digit > 0) {
        if (this._cellConstraints(i) & encode(digit)) {
          this._isValid = false;
        }
        this._addConstraint(i, digit);
      }
    });
  }

  /**
   * Resets empty cells to include all candidates.
   */
  _resetEmptyCells() {
    this._board = this._board.map((val) => (isDigit(val) ? val : ALL));
  };

  /**
   * Walks the board, trying to solve for empty cells through constraint propagation.
   *
   * When finished, all cell values should have reduced to valid candidates.
   */
  _reduce() {
    for (let i = 0; i < 81; i++) this._reduce2(i);
  }

  /**
   * Attempts to solve a given cell or reduce its candidates.
   *
   * If successful reduced, this is recursively called for all the cell's neighbors.
   * @param {number} cellIndex
   */
  _reduce2(cellIndex) {
    // Original candidates before potentially modifying.
    const candidates = this._board[cellIndex];

    // Cell is already resolved to a digit.
    if (isDigit(candidates)) return false;

    // Cell has no candidate digits.
    if (candidates <= 0) {
      this._isValid = false;
      return false;
    }

    // Apply constraints bitmask.
    let reducedCandidates = (candidates & ~this._cellConstraints(cellIndex));

    // If there are no more candidates for the cell, the board is invalid.
    if (reducedCandidates <= 0) {
      this._isValid = false;
      this.setDigit(0, cellIndex);
      return false;
    }

    if (isDigit(reducedCandidates)) {
      this.setDigit(decode(reducedCandidates), cellIndex);
    } else {
      const uniqueCandidate = this._getUniqueCandidate(cellIndex);
      if (uniqueCandidate > 0) {
        this.setDigit(decode(uniqueCandidate), cellIndex);
        reducedCandidates = uniqueCandidate;
      } else {
        this._board[cellIndex] = reducedCandidates;
      }
    }

    // Propagate to neighboring cells if there was any reduction to the cell.
    if (reducedCandidates < candidates) {
      for (let ni of CELL_NEIGHBORS[cellIndex]) this._reduce2(ni);
    }
  };

  /**
   *
   * @param {number} ci
   * @returns {number}
   */
  _getUniqueCandidate(ci) {
    const candidates = CANDIDATES[this._board[ci]];
    for (let candidate of candidates) {
      let unique = true;
      for (let ni of ROW_NEIGHBORS[ci]) {
        if ((this._board[ni] & candidate) > 0) {
          unique = false;
          break;
        }
      }
      if (unique) {
        return candidate;
      }

      unique = true;
      for (let ni of COL_NEIGHBORS[ci]) {
        if ((this._board[ni] & candidate) > 0) {
          unique = false;
          break;
        }
      }
      if (unique) {
        return candidate;
      }

      unique = true;
      for (let ni of REGION_NEIGHBORS[ci]) {
        if ((this._board[ni] & candidate) > 0) {
          unique = false;
          break;
        }
      }
      if (unique) {
        return candidate;
      }
    }

    return 0;
  }

  /**
   * Finds the index of an empty cell which contains the fewest candidates.
   * @return {number} Cell index, or `-1` if there are no empty cells.
   */
  _pickEmptyCell() {
    if (this._numEmptyCells === 0) return -1;

    // TODO Keep track of empty cells in state for instant lookup.
    let minNumCandidates = DIGITS + 1;
    let minCandidatesBucket = [];
    this._board.forEach((candidates, ci) => {
      const numCandidates = BIT_COUNT_MAP[candidates];
      if (numCandidates > 1) {
        if (numCandidates < minNumCandidates) {
          minNumCandidates = numCandidates;
          minCandidatesBucket = [ci];
        } else if (numCandidates === minNumCandidates) {
          minCandidatesBucket.push(ci);
        }
      }
    });

    // If min still === 10, then there are no empty cells.
    return (minNumCandidates === (DIGITS + 1)) ? -1 : chooseRandom(minCandidatesBucket);
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
    if (!this._isValid) {
      return 0;
    }

    if (this.numEmptyCells > (SPACES - MIN_CLUES)) {
      return 2;
    }

    let solutionCount = 0;
    this.searchForSolutions2({ solutionFoundCallback: (_) => (++solutionCount < 2) });
    return solutionCount;
  }

  /**
   * Attempts to solve this board.
   * The board values will be updated only if a single solution is found.
   *
   * @returns {boolean} True if there is a single solution; otherwise false.
   */
  solve() {
    let solution = null;
    let count = 0;
    this.searchForSolutions2({
      solutionFoundCallback: (_solution) => {
        solution = _solution;
        count++;
        return count < 2;
      }
    });

    if (count === 1) {
      this.setBoard(solution.board);
      return true;
    }

    return false;
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

  // TODO Cache fingerprints until board changes. Maybe make these getters.
  fingerprint_d(level) {
    if (!this.isConfig()) throw new Error('Invalid configuration.');
    if (level < 2 || level > 4) throw new Error('Unsupported level. [2 <= level <= 4]');

    const ss = new SudokuSieve({ config: this });
    ss.seed(level);

    let minM = SPACES;
    let maxM = 0;
    /** @type {number[]} */
    const itemsByM = Array(SPACES).fill(0);
    ss.items.forEach(item => {
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
   *
   * @returns {number}
   */
  difficulty() {
    const root = new Sudoku(this);
    root._resetEmptyCells();
    root._resetConstraints();
    root._reduce();

    if (root.isSolved()) return 1;
    if (!root._isValid) return -1;

    /**
     * @typedef {Object} Nodey
     * @property {Sudoku} sudoku
     * @property {number} difficulty
     */

    /** @type {Nodey[]} */
    let queue = [{ sudoku: root, difficulty: 1 }];

    while (queue.length > 0) {
      const node = queue.shift();
      const sudoku = node.sudoku;
      if (sudoku.isSolved()) return node.difficulty;

      // Get all empty cells of minimum candidates
      let minNumCandidates = DIGITS + 1;
      let candyBucket = [];
      sudoku._board.forEach((candidates, ci) => {
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
        CANDIDATE_DECODINGS[sudoku._board[emptyCi]].forEach(digit => {
          const nextSudoku = new Sudoku(sudoku);
          nextSudoku.setDigit(digit, emptyCi);
          for (let ni of CELL_NEIGHBORS[emptyCi]) nextSudoku._reduce2(ni);
          queue.push({ sudoku: nextSudoku, difficulty: (node.difficulty + 1) });
        });
      });

      // Priority queue hack
      queue.sort((a, b) => (a.difficulty - b.difficulty));
    }

    return -1;
  }
}

export default Sudoku;
