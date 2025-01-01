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
import { bitCombo, nChooseK, randomCombo } from '../util/perms.js';
import Debugger from '../util/debug.js';
import SudokuSieve from './SudokuSieve.js';
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
const EMPTY_BOARD = Array(SPACES).fill(0);

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
        board._clues[index] = digit;
      }
    });

    return board;
  }

  /**
   *
   * @param {Sudoku} config
   * @param {bigint[]} sieve
   * @returns {number[]}
   */
  static cellsToKeepFromSieve(config, sieve) {
    let _sieve  = [...sieve];
    const cellsToKeep = [];

    while (_sieve.length > 0) {
      let maximum = 0;
      let reductionMatrix = _sieve.reduce((reductionMatrix, mask) => {
        config.filter(mask).board.forEach((val, ci) => {
          if (val > 0) {
            reductionMatrix[ci]++;

            if (reductionMatrix[ci] > maximum) {
              maximum = reductionMatrix[ci];
            }
          }
        });
        return reductionMatrix;
      }, [...EMPTY_BOARD]);

      const maxValueCells = reductionMatrix.reduce((max, val, ci) => {
        if (val === maximum) {
          max.push(ci);
        }
        return max;
      }, []);

      const cellToKeep = chooseRandom(maxValueCells);
      cellsToKeep.push(cellToKeep);

      // Filter out all sieve items that use the cell
      _sieve = _sieve.filter((mask) => (config.filter(mask).board[cellToKeep] === 0));
    }

    return cellsToKeep;
  }

  static _defaultGenerationOptions = Object.freeze({
    numClues: SPACES,
    timeOutMs: 0,
    config: null,
    amount: 1,
    normalize: false,
    callback: null
  });

  /**
   * Generates a Sudoku board with various options. By default, generates a single Sudoku config.
   * @param {Object} options
   * @param {number} [options.numClues=NUM_SPACES] (in `[17, 81]`; default: `81`) The number of clues to generate.
   * @param {number} [options.timeOutMs=0] (default: `0` (no limit)) The maximum time to spend generating.
   * @param {Sudoku} [options.config=null] (default: `null`) A configuration to use for generating puzzle boards. One will be generated if not provided.
   * If generating configs, this will be ignored.
   * @param {number} [options.amount=1] (in `[1, 1000]`; default: `1`) The number of puzzles to generate.
   * @param {boolean} [options.normalize=false] (default: `false`) Whether to normalize the generated board.
   * @param {boolean} [options.useSieve=false] (default: `false`) Whether to use a sieve to generate puzzles.
   * @param {SudokuSieve} [options.sieve=null] (default: `null`) The sieve to use while generating puzzles.
   * @param {(generated: Sudoku) => void} [options.callback=null] (default: `null`) A callback function to call when a puzzle is generated.
   * @returns {object[]} The generated Sudoku boards along with some metrics.
   */
  static generate({
    numClues = SPACES,
    timeOutMs = 0,
    config = null,
    amount = 1,
    normalize = false,
    useSieve = false,
    sieve = null,
    callback = null
  } = this._defaultGenerationOptions) {
    debug.log(`generate> options: {\n` +
      `  numClues: ${numClues},\n` +
      `  timeOutMs: ${timeOutMs},\n` +
      `  config: ${config},\n` +
      `  amount: ${amount},\n` +
      `  normalize: ${normalize},\n` +
      `  useSieve: ${useSieve},\n` +
      `  sieve: ${sieve ? `length: ${sieve.length})` : ''},\n` +
      `  callback: ${callback}\n}`
    );

    // Validate options
    if (typeof numClues !== 'number' || numClues < MIN_CLUES || numClues > SPACES) {
      throw new Error(`Invalid number of clues: ${numClues}`);
    }
    if (typeof amount !== 'number' || amount < 1 || amount > 1000) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    if (typeof timeOutMs !== 'number' || timeOutMs < 0) {
      debug.log(`generate> Correcting invalid timeOutMs ${timeOutMs} to 0.`);
      timeOutMs = 0;
    }
    normalize = Boolean(normalize);
    useSieve = Boolean(useSieve);
    if (config !== null && (!(config instanceof Sudoku) || !config.isConfig())) {
      throw new Error(`Invalid config: ${config}`);
    }
    if (callback !== null && typeof callback !== 'function') {
      throw new Error(`Invalid callback: ${callback}`);
    }

    const isTrackingTime = timeOutMs > 0;
    const startTime = Date.now();
    const isGeneratingConfigs = numClues === SPACES;

    const results = [];

    if (isGeneratingConfigs) {
      for (let i = 0; i < amount; i++) {
        const searchResults = Sudoku.configSeed().searchForSolutions3({
          timeOutMs,
          solutionFoundCallback: (solution) => false
        });

        // For debug
        if (searchResults.solutions.length === 0) {
          debug.log(`generate> ❌ Failed to generate config.`);
          debug.log(JSON.stringify(searchResults));
        }

        const board = searchResults.solutions[0];
        board._clues = board.board;
        if (normalize) {
          board.normalize();
        }

        if (callback !== null && board) {
          callback(board);
        }
        results.push(searchResults);
        debug.log(`generate> Generated config ${i + 1}/${amount}: ${board.toString()}`);

        if (isTrackingTime) {
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime >= timeOutMs) {
            debug.log(`generate> Time out after ${elapsedTime}ms.`);
            break;
          }
        }
      }
    } else {
      if (!config) {
        // console.log('generate> Generating config for puzzles...');
        config = this.generateConfig({ normalize });
        // console.log(`          Done. ${config.toString()}`);
      }

      // Keeps track of cells to keep in the puzzle. This is populated below if using the sieve method.
      let cellsToKeep = [];

      // If clues are low, it's advantageous to generate a sieve to filter invalid puzzles.
      // The sieve will be used to make better decisions about which cells to keep or remove.
      // let sieve = null;
      if (useSieve) {
        const sieveGenerationStart = Date.now();
        // TODO #25 Sudoku.loadSieveFile(filename) Supplies low-clue generation with a sieve for finding puzzles.
        //      Maybe this should be loaded automatically if it exists in the same directory. I just don't know
        //      how that might work with a browser version.
        // TODO Sudoku.findOrGenerateSieve(config, options) Finds the sieve for the given config, or generates one.
        //      Generated sieves won't be saved to file
        // TODO Sudoku.generateSieve(config, options)
        // TODO Aside: How to generate and save sieves? Maybe a separate tool? Subrepo?
        // console.log('generate> Generating sieve...');
        // TODO Move this to Sudoku.generateSieve
        // TODO How to decide what options to pass to generateSieve?
        // TODO Pass timeOutMs to generateSieve
        if (!sieve) {
          sieve = new SudokuSieve({ config });
        }

        // These 2-digit invalid cycles are extremely fast to generate, so we'll make sure
        // the sieve has at least these few basic items.

        console.log(`TODO: Update once after sieve search re-implemented`);
        // sieve.add(...searchForSieve2(config, { maxDigits: 2, maxLength: 18 }));
        // console.log(`          Done in ${Date.now() - sieveGenerationStart}ms. Sieve length: ${sieve.length}`);

        // Create reduction matrix for the sieve.
        // The reduction matrix is the 9x9 matrix where each cell contains the number of
        // times that cell appears as part of the unresolvable chain among sieve items.

        // The reduction matrix is used to determine which cells should be kept in the puzzle.
        // Each time a cell is picked to keep, the reduction matrix is updated to reflect the
        // removal of that cell from the sieve.

        // TODO We could do this for every puzzle generation attempt to keep things fresh
        // cellsToKeep.push(...Sudoku.cellsToKeepFromSieve(config, sieve));
      }

      const POPS_UNTIL_RESET = 100;

      for (let i = 0; i < amount; i++) {

        // cellsToKeep = [...Sudoku.cellsToKeepFromSieve(config, sieve)];
        cellsToKeep = sieve ? sieve._generateMaskCells() : [];

        const result = {
          puzzle: null,
          cellsKept: [...cellsToKeep],
          pops: 0,
          resets: 0,
          timeMs: 0,
        };

        const puzzleGenStartTime = Date.now();
        // const config = this.generateConfig();
        const rootNode = new SudokuNode(config);
        let puzzleStack = [rootNode];
        let numPops = 0; // Number of pops. If the search resets, so does this.

        // Not using maxPops for now
        // while (puzzleStack.length > 0 && numPops < maxPops) {
        while (puzzleStack.length > 0) {
          const puzzleNode = puzzleStack[puzzleStack.length - 1]; // peek
          const puzzle = puzzleNode.sudoku;
          puzzleNode.visit();
          debug.log(`generate> (empty cells: ${puzzle.numEmptyCells}) ${puzzle.toString()}`);

          // _board = puzzle.encodedBoard;
          // TODO Try using hasUniqueSolution cache like in siever
          if (!puzzle.hasUniqueSolution()) {
            debug.log(`generate> no unique solution, popping...`);
            puzzleStack.pop();
            puzzleNode.dispose();
            result.pops++;

            // TODO explore whether it's possible to keep a history for each node,
            //  i.e. track which cells were attempted to be removed.
            //  Then, this won't need any sort of restart fail-safe.

            // After a certain number of pops, restart the search. This ensures that
            // that the algorithm won't continue to try to remove cells when there is
            // no path to a valid puzzle.
            if (++numPops >= POPS_UNTIL_RESET) {
              puzzleStack = [rootNode];
              numPops = 0;
              result.resets++;
            }

            continue;
          }

          if (puzzle.numEmptyCells >= (SPACES - numClues)) {
            // debug.log(`generate> found puzzle with ${puzzle.numEmptyCells} empty cells`);

            // Just this one time debugging, print the puzzle and the time elapsed
            // console.log(`✅ ${puzzle.toString()} in ${Date.now() - puzzleGenStartTime}ms`);
            break;
          }

          const next = puzzleNode.getNextUnvisited(cellsToKeep);
          if (next) {
            puzzleStack.push(next);
          } else {
            puzzleStack.pop();
            result.pops++;

            if (++numPops >= POPS_UNTIL_RESET) {
              puzzleStack = [rootNode];
              numPops = 0;
              result.resets++;
            }
          }
        }

        // Not using maxPops for now
        // if (numPops >= maxPops || puzzleStack.length === 0) {
        //   return null;
        // }
        result.timeMs = Date.now() - puzzleGenStartTime;
        if (puzzleStack.length === 0) {
          // console.log(`generate> ❌ Failed to generate puzzle ${i + 1}/${amount}.`);
        } else {
          const puzzle = puzzleStack[puzzleStack.length - 1].sudoku;
          // puzzle._clues = puzzle.board;
          // return puzzle;
          result.puzzle = new Sudoku(puzzle);
          results.push(result);

          debug.log(`generate> Generated puzzle ${i + 1}/${amount}: ${puzzle.toString()}`);
          if (callback !== null) {
            callback(new Sudoku(puzzle));
          }
        }
      }
    }

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    // console.log(`Generated ${results.length} sudoku puzzles in ${elapsedTime}ms.`);

    // TODO Return structure with result and other stats
    return results;
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
   * @param {number} numClues
   * @param {Sudoku} config
   * @returns {Sudoku}
   */
  static _randomCombo(numClues, config = Sudoku.generateConfig()) {
    const keep = randomCombo(SPACES, numClues);
    let keepIndex = 0;
    return new Sudoku(config.board.map((digit, i) => {
      if (keep[keepIndex] === i) {
        keepIndex++;
        return digit;
      }
      return 0;
    }));
  }

  // TODO some methods have similar params but in different orders and it's confusing

  /**
   *
   * @param {Sudoku} config
   * @param {bigint} mask Bit mask of the cells to keep. The least significant bit
   * represents the last cell, and the most significant bit (81) represents the first cell.
   * @returns {Sudoku}
   */
  static mask(config, mask) {
    const board = new Sudoku(config).board;
    for (let ci = 0; ci < SPACES; ci++) {
      board[ci] = (mask & (1n << BigInt(SPACES - ci - 1))) > 0n ? board[ci] : 0;
    }
    return new Sudoku(board);
  }

  get mask() {
    return this.board.reduce((acc, digit, ci) => (
      (digit > 0) ? (acc | (1n << BigInt(SPACES - 1 - ci))) : acc
    ), 0n);
  }

  get emptyCellMask() {
    return this.board.reduce((acc, digit, ci) => (
      (digit === 0) ? (acc | (1n << BigInt(SPACES - 1 - ci))) : acc
    ), 0n);
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
   * Returns a Sudoku board with only the given cells.
   * @param {number[]} cellIndices
   * @returns {Sudoku}
   */
  keepIndices(cellIndices) {
    return new Sudoku(this.board.map((d, i) => (cellIndices.includes(i) ? d : 0)));
  }

  /**
   * Returns a Sudoku board with the given cells removed.
   * @param {number[]} cellIndices
   * @returns {Sudoku}
   */
  filterOutIndices(cellIndices) {
    return new Sudoku(this.board.map((d, i) => (cellIndices.includes(i) ? 0 : d)));
  }

  /**
   * Returns the number from [0, (81 choose (81-puzzle.numEmptyCells))], representing the
   * index of the puzzle in the search space.
   *
   * @param {Sudoku} puzzle
   * @returns {BigInt}
   */
  static getCombo(puzzle) {
    const numClues = SPACES - puzzle.numEmptyCells;
    const keep = puzzle.board.reduce((keep, val, i) => {
      if (val > 0) {
        keep.push(i);
      }
      return keep;
    }, []);

  }

  /**
   *
   * @param {number} numClues
   * @param {Sudoku} config
   * @returns
   */
  static _randomComboPuzzle(numClues, config = Sudoku.generateConfig()) {
    let puzzle;
    while (!(puzzle = Sudoku._randomCombo(numClues, config)).hasUniqueSolution());
    return puzzle;
  }

  // Uses DFS to locate valid sudoku puzzle.
  /**
   *
   * @param {number} numClues
   * @param {number} maxTests
   * @returns {Sudoku | null}
   */
  static generatePuzzle2(numClues = 27, maxTests = 1<<24) {
    debug.log('generatePuzzle2');

    // TODO This is kinda dumb, yeah?
    if (numClues >= 36) {
      return this._randomComboPuzzle(numClues);
    }

    /**
     * @typedef {Object} SudokuNode
     * @property {Sudoku} sudoku
     * @property {Sudoku[] | null} nexts
     */

    /** @type {SudokuNode[]} */
    let stack = [];
    let testCounter = 0;
    let popsUntilReset = 0;

    while (++testCounter <= maxTests) {
      // Reset if necessary
      if (stack.length === 0 || popsUntilReset === 0) {
        // Clear the stack and start over
        stack = [{
          sudoku: Sudoku._randomComboPuzzle(numClues + Math.ceil((SPACES - numClues) / 4)),
          nexts: null,
        }];
        popsUntilReset = (SPACES - numClues)**2;
        debug.log(`RESET    ${stack[0].sudoku.toString()}`);
      }

      const top = stack[stack.length - 1];
      const sudoku = top.sudoku;
      // sudoku._reduce();

      const filledCells = SPACES - sudoku.numEmptyCells;
      debug.log(`${filledCells}${(filledCells < 10) ? ' ' : ''}       ${sudoku.toString()}`);

      if (!sudoku.hasUniqueSolution()) {
        debug.log(`POP -NU-`);
        stack.pop();
        popsUntilReset--;
        continue;
      }

      if (sudoku.numEmptyCells >= (SPACES - numClues)) {
        debug.log(`SOLUTION ${sudoku.toString()}`);
        return sudoku;
      }

      if (top.nexts === null) {
        top.nexts = sudoku._getNextsSubtractive();
      }

      if (top.nexts.length > 0) {
        // Get a random next
        const next = removeRandom(top.nexts);
        stack.push({ sudoku: next, nexts: null });
        // debug.log(`    ++++ ${next.toString()}`);
      } else {
        debug.log(`POP -NN-`);
        stack.pop();
        popsUntilReset--;
      }
    }

    return null;
  }

  /**
   * Attempts to generate a puzzle with the given number of clues.
   *
   * TODO: The search space will be cached in the file system
   * @param {number} numClues
   * @returns {Sudoku | null} solution
   */
  static generatePuzzle3(numClues = 27, solution = Sudoku.generateConfig()) {

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
   * @param {number} [options.timeOutMs=0] (default: `0` (no limit)) The maximum time to spend generating.
   * @returns {Sudoku | null} A valid configuration, or `null` if none was found.
   */
  static generateConfig({ normalize, timeOutMs } = {
    normalize: false,
    // TODO I don't think we need a timeout for generating configs
    timeOutMs: 0
  }) {
    const config = Sudoku.configSeed().firstSolution(timeOutMs);
    config._clues = config.board;
    return (normalize) ? config.normalize() : config;
  }

  /**
   * Performs a solutions search for the board and returns the first found.
   * @param {object} options
   * @param {number} [options.timeOutMs=0] (default: `0` (no limit)) The maximum time to spend generating.
   * @returns {Sudoku | null} The first solution found, or `null` if none was found.
   */
  firstSolution(timeOutMs = 0) {
    const results = this.searchForSolutions2({
      timeOutMs,
      solutionFoundCallback: (solution) => false
    });
    return results.solutions.length > 0 ? results.solutions[0] : null;
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
   * Returns a set of antiderivative puzzles for the given puzzle.
   *
   * An antiderivative of a puzzle is the set of all puzzles extrapolated from
   * the given puzzle for each empty cell and for each empty cell's different
   * candidates.
   *
   * Note this means that the antiderivative set may contain invalid puzzles
   * or puzzles with multiple solutions, as 'cell's candidates' is not well defined here.
   * TODO check this last statement
   *
   * @returns {Sudoku[]}
   */
  getAntiderivatives() {
    const _puzzle = new Sudoku(this);
    _puzzle._resetEmptyCells();
    _puzzle._reduce();
    return _puzzle.board.reduce((acc, digit, ci) => {
      if (digit === 0) {
        _puzzle.getCandidates(ci).forEach((candidate) => {
          const newPuzzle = new Sudoku(_puzzle);
          newPuzzle.setDigit(candidate, ci);
          acc.push(newPuzzle);
        });
      }

      return acc;
    }, []);
  }

  /**
   *
   * @param {number} regionMask A 9-bit mask where each bit represents a region
   * and whether to fill it with random digits.
   */
  _fillSections(regionMask) {
    for (let regIndex = 0; regIndex < DIGITS; regIndex++) {
      if ((regionMask & (1<<(DIGITS - 1 - regIndex))) > 0) {
        this.fillRegion(regIndex);
      }
    }
  }

  /**
   * Fills the given region with the random digits 1-9 with no regard for board validity.
   *
   * @param {number} regionIndex
   */
  fillRegion(regionIndex) {
    shuffle(DIGIT_BAG).forEach((digit, i) => this.setDigit(digit, indicesFor.region[regionIndex][i]));
  }

  /**
   *
   * @param {Sudoku} other
   */
  equals(other) {
    return this.board.every((val, i) => val === other.board[i]);
  }

  /**
   * Performs a breadth-first search for sudoku solution(s) of the given board.
   * The given callback function is triggered when a solution is found. If the callback
   * returns `false`, the search will stop;
   * otherwise it will continue searching for solutions.
   *
   * @param {SolutionFoundCallback} solutionFoundCallback Called with a solution board when one is found.
   * If this returns `true`, then the search will continue for more solutions;
   * otherwise the search will stop.
   * @return {boolean} `true` if the search exhausted all possible solutions or hit maximum iterations; otherwise `false`.
   */
  searchForSolutions(solutionFoundCallback, maxIterations = Number.POSITIVE_INFINITY) {
    const root = new Sudoku(this);
    root._resetEmptyCells();
    const solutionQueue = [root];

    let iterations = 0;
    while (solutionQueue.length > 0 && iterations++ < maxIterations) {
      let possibleSolution = solutionQueue.shift();
      // debug.log(`> ${possibleSolution.toString()}`);

      if (possibleSolution._reduce()) {
        // debug.log(`R ${possibleSolution.toString()}`);
      }

      if (possibleSolution.numEmptyCells === 0) {
        if (possibleSolution.isSolved()) {
          // debug.log(`! ${possibleSolution.toString()}`);
          if (!solutionFoundCallback(possibleSolution)) {
            return false;
          } else {
            // debug.log('continuing search...');
          }
        }
      } else {
        const emptyCellIndex = possibleSolution._pickEmptyCell();
        if (emptyCellIndex >= 0) {
          const candidates = possibleSolution.getCandidates(emptyCellIndex);
          if (candidates.length === 0) {
            // debug.log(`-`);
          } else {
            candidates.forEach((candidateDigit) => {
              const next = new Sudoku(possibleSolution);
              next.setDigit(candidateDigit, emptyCellIndex);
              solutionQueue.push(next);
              // debug.log(`+ ${next.toString()}`);
            });
          }
        }
      }
    }

    return (iterations < maxIterations);
  }

  /**
   * Performs a depth-first search for sudoku solution(s) of the given board.
   * The given callback function is triggered when a solution is found. If the callback
   * returns `false`, the search will stop;
   * otherwise it will continue searching for solutions.
   *
   * @param {object} options
   * @param {number} [options.timeOutMs=0] (default: `0` (no limit)) The maximum time to spend searching.
   * @param {(solution: Sudoku) => boolean} [options.solutionFoundCallback] Called with a solution when one is found.
   * If the callback returns truthy, the search will continue.
   * @return {{
   *  solutions: Sudoku[],
   *  iterations: number,
   *  branches: number,
   *  timeElapsedMs: number,
   *  complete: boolean,
   *  timedOut: boolean,
   *  terminatedByCallback: boolean
   * }} An object with the search results and metrics:
   * - `solutions` - The found solutions.
   * - `iterations` - The number of iterations performed, i.e., how many boards were checked.
   * - `branches` - The number of branches explored, i.e., how many times the algorithm picked an empty cell and tried solving it for each candidate.
   * - `timeElapsedMs` - The time elapsed.
   * - `complete` - Whether the entire search space was checked.
   * - `timedOut` - Whether the search timed out before completing.
   * - `terminatedByCallback` - Whether the search was terminated by the callback instead of checking the entire search space.
   */
  searchForSolutions2({
    timeOutMs = 0,
    solutionFoundCallback = (solution) => true
  }) {
    timeOutMs = Number(timeOutMs) || 0;

    const isTimeConstraint = timeOutMs > 0;
    const startTime = Date.now();

    const root = new Sudoku(this);
    root._resetEmptyCells();
    root._resetConstraints();

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
      sudoku._reduce();
      const emptyCellIndex = sudoku._pickEmptyCell();

      return ({
        /** @type {Sudoku} */
        sudoku,
        emptyCellIndex,
        emptyCellCandidatesEncoded: (emptyCellIndex >= 0) ? sudoku._board[emptyCellIndex] : 0,

        /** @return {Nodey | null} */
        next() {
          if (this.emptyCellCandidatesEncoded === 0) {
            return null;
          }

          const s = new Sudoku(this.sudoku);
          const randomCandidateDigit = chooseRandom(CANDIDATE_DECODINGS[this.emptyCellCandidatesEncoded]);
          s.setDigit(randomCandidateDigit, this.emptyCellIndex);
          this.emptyCellCandidatesEncoded &= ~(ENCODER[randomCandidateDigit])
          return Nodey(s);
        }
      });
    };

    /** @type {Nodey[]} */
    let stack = [Nodey(root)];

    const result = {
      /** @type {Sudoku[]} */
      solutions: [],
      iterations: 0,
      branches: 0,
      timeElapsedMs: 0,
      complete: false,
      timedOut: false,
      terminatedByCallback: false
    };

    while (stack.length > 0) {
      // Time check
      if (isTimeConstraint) {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= timeOutMs) {
          debug.log(`searchForSolutions2> Time out after ${elapsedTime}ms.`);
          result.timedOut = true;
          break;
        }
      }

      const top = stack[stack.length - 1];
      const sudoku = top.sudoku;
      result.iterations++;
      // debug.log(`searchForSolutions2> ?${' '.repeat(stack.length)}${sudoku.toString()}`);
      // Reduce obvious candidates first. This may just solve the puzzle.

      if (sudoku.isSolved()) {
        result.solutions.push(new Sudoku(sudoku));
        stack.pop();
        if (Boolean(solutionFoundCallback(sudoku))) {
          continue;
        } else {
          result.terminatedByCallback = true;
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

    result.complete = (!result.timedOut && !result.terminatedByCallback);
    result.timeElapsedMs = Date.now() - startTime;
    return result;
  }

  /**
   * Performs a depth-first search for sudoku solution(s) of the given board.
   * The given callback function is triggered when a solution is found. If the callback
   * returns `false`, the search will stop;
   * otherwise it will continue searching for solutions.
   *
   * @param {object} options
   * @param {number} [options.timeOutMs=0] (default: `0` (no limit)) The maximum time to spend searching.
   * @param {(solution: Sudoku) => boolean} [options.solutionFoundCallback] Called with a solution when one is found.
   * If the callback returns truthy, the search will continue.
   * @param {number} [options.concurrentBranches=81] Number of depth-first search branches
   * that can be explored concurrently. i.e., Maximum number of stacks the DFS can break out at one time. Each
   * stack takes turns progressing and checking for solutions. This helps prevent the scenario where some invalid
   * puzzles with few clues take a long time to find a second solution, due to the depth-first search space being
   * very large and taking significant time to backtrack.
   * @return {{
   *  solutions: Sudoku[],
   *  iterations: number,
   *  branches: number,
   *  timeElapsedMs: number,
   *  complete: boolean,
   *  timedOut: boolean,
   *  terminatedByCallback: boolean
   * }} An object with the search results and metrics:
   * - `solutions` - The found solutions.
   * - `iterations` - The number of iterations performed, i.e., how many boards were checked.
   * - `branches` - The number of branches explored, i.e., how many times the algorithm picked an empty cell and tried solving it for each candidate.
   * - `timeElapsedMs` - The time elapsed.
   * - `complete` - Whether the entire search space was checked.
   * - `timedOut` - Whether the search timed out before completing.
   * - `terminatedByCallback` - Whether the search was terminated by the callback instead of checking the entire search space.
   */
  searchForSolutions3({
    timeOutMs = 0,
    solutionFoundCallback = () => true,
    concurrentBranches = 9,
  } = {}) {
    timeOutMs = Number(timeOutMs) || 0;

    const isTimeConstraint = timeOutMs > 0;
    const startTime = Date.now();

    const root = new Sudoku(this);
    root._resetEmptyCells();
    root._resetConstraints();

    /**
     * @typedef {Object} SudokuNode
     * @property {Sudoku} sudoku
     * @property {Sudoku[] | null} nexts
     */

    /** @type {SudokuNode[][]} */
    let stacks = [[{ sudoku: root, nexts: null }]];

    const result = {
      /** @type {Sudoku[]} */
      solutions: [],
      iterations: 0,
      branches: 0,
      timeElapsedMs: 0,
      complete: false,
      timedOut: false,
      terminatedByCallback: false
    };

    let emptyStacks = [];
    while (stacks.length > 0 && !result.terminatedByCallback) {
      // Time check
      if (isTimeConstraint) {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= timeOutMs) {
          debug.log(`searchForSolutions3> Time out after ${elapsedTime}ms.`);
          result.timedOut = true;
          break;
        }
      }

      // Snapshot this since new stacks may be added during loop
      const numStacks = stacks.length;
      for (let i = 0; i < numStacks; i++) {
        const stack = stacks[i];

        if (stack.length === 0) {
          emptyStacks.push(i);
          continue;
        }

        const top = stack[stack.length - 1];
        const sudoku = top.sudoku;
        result.iterations++;
        // Reduce obvious candidates first. This may just solve the puzzle.
        sudoku._reduce();

        if (sudoku.isSolved()) {
          result.solutions.push(new Sudoku(sudoku));
          stack.pop();
          if (Boolean(solutionFoundCallback(sudoku))) {
            continue;
          } else {
            result.terminatedByCallback = true;
            // stacks[i] = null;
            break;
          }
        }

        // Finds an empty cell to fill (with least candidates), then generates a collection
        // of Sudokus with each of the possible candidates filled in.
        // We'll need to check each of these for solutions.
        if (top.nexts === null) {
          top.nexts = shuffle(sudoku._getNextsAdditive());
        }

        if (top.nexts.length > 0) {
          // Pick randomly from the list of nexts, and push it onto the stack.
          result.branches++;
          stack.push({ sudoku: top.nexts.pop(), nexts: null });

          // If there are still more, and we haven't hit the branch limit, start a new stack.
          while (stacks.length < concurrentBranches && top.nexts.length > 0) {
            result.branches++;
            stacks.push([{ sudoku: top.nexts.pop(), nexts: null }]);
          }
        } else {
          stack.pop();
        }
      }

      // Remove empty stacks
      while (emptyStacks.length > 0) {
        stacks.splice(emptyStacks.pop(), 1);
      }
    }
    stacks = null;

    result.complete = (!result.timedOut && !result.terminatedByCallback);
    result.timeElapsedMs = Date.now() - startTime;
    return result;
  }

  /**
   * TODO This is a work in progress - Currently just a copy of `searchForSolutions2`.
   * @param {SolutionFoundCallback} solutionFoundCallback
   * @returns {boolean}
   */
  searchForSolutions3Cached(solutionFoundCallback) {
    const root = new Sudoku(this);
    root._resetEmptyCells();
    const stack = [{ sudoku: root, nexts: null }];

    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      const sudoku = top.sudoku;
      sudoku._reduce();

      // Is this sudoku a configuration?
      if (sudoku.numEmptyCells === 0) {
        if (sudoku.isSolved()) {
          if (!solutionFoundCallback(sudoku)) {
            return false;
          }
        }
      }

      // Populate the list of nexts if necessary.
      if (top.nexts === null) {
        top.nexts = sudoku._getNextsAdditive();
      }

      // If there are no nexts, pop the stack.
      if (top.nexts.length > 0) {
        // Pick the first from the list of nexts to push onto the stack.
        const next = top.nexts.shift();
        stack.push({ sudoku: next, nexts: null });
      } else {
        stack.pop();
      }
    }

    return true;
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
     * @typedef {object} Area
     * @property {number} index
     * @property {number} constraints
     * @property {number[]} candidateCount
     * @property {Cell[]} cells
     */

    if (data instanceof Sudoku) {
      this._board = [...data._board];
      this._constraints = [...data._constraints];
      this._clues = data.board;
      this._numEmptyCells = data._numEmptyCells;
    } else if (typeof data === 'string') {
      const parsed = Sudoku.fromString(data);
      this._board = [...parsed._board];
      this._constraints = [...parsed._constraints];
      this._clues = parsed.clues;
      this._numEmptyCells = parsed._numEmptyCells;
    } else if (Array.isArray(data)) {
      this._board = [...EMPTY_BOARD];
      this._clues = [...EMPTY_BOARD];
      this._constraints = Array(DIGITS).fill(0);
      if (data.length === SPACES) {
        this.setBoard(data);
        this._clues = this.board;
      }
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
   * Returns a copy of the board encoded as an array of bit masks.
   * @returns {number[]}
   */
  get encodedBoard() {
    return [...this._board];
  }

  /**
   * Returns the initial clues on the board.
   * @returns {number[]}
   */
  get clues() {
    return [...this._clues];
  }

  /**
   * Returns the number of clues on the board.
   * @returns {number}
   */
  get numClues() {
    return this._clues.filter((val) => val > 0).length;
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

    digits.forEach((digit, i) => {
      if (typeof digit !== 'number') {
        throw new Error(`board is invalid (type): ${typeof digit} at index ${i}.`);
      }

      if (digit < 0 || digit > DIGITS) {
        throw new Error(`board is invalid (value): ${digit} at index ${i}.`);
      }

      this.setDigit(digit, i);
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

  _getCandidatesEncoded(cellIndex) {
    // return ENCODER.slice(1).filter((encoded) => (this._board[cellIndex] & encoded) > 0);
    return CANDIDATES[this._board[cellIndex]];
  }

  getPeers(cellIndex) {
    return [
      ...indicesFor.row[cellRow(cellIndex)],
      ...indicesFor.col[cellCol(cellIndex)],
      ...indicesFor.region[cellRegion(cellIndex)],
    ].filter((i) => i !== cellIndex);
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
   *
   */
  shuffleDigits() {
    const digits = range(DIGITS + 1, 1);
    shuffle(digits).forEach((digit, i) => {
      swapAllInArr(this._board, encode(digit), encode(i + 1));
      swapAllInArr(this._clues, digit, i + 1);
    });
  }

  reflectOverHorizontal() {
    reflectOverHorizontal(this._board, DIGITS);
    reflectOverHorizontal(this._clues, DIGITS);
  }

  reflectOverVertical() {
    reflectOverVertical(this._board, DIGITS);
    reflectOverVertical(this._clues, DIGITS);
  }

  /**
   * Reflects the board values over the diagonal axis (line from bottomleft to topright).
   */
  reflectOverDiagonal() {
    reflectOverDiagonal(this._board);
    reflectOverDiagonal(this._clues);
  }

  reflectOverAntidiagonal() {
    reflectOverAntiDiagonal(this._board);
    reflectOverAntiDiagonal(this._clues);
  }

  rotate90() {
    rotateArr90(this._board);
    rotateArr90(this._clues);
  }

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

  _resetConstraints() {
    this._constraints.fill(0);
    this.board.forEach((digit, i) => {
      if (digit > 0) {
        this._addConstraint(i, digit);
      }
    });
  }

  /**
   * Resets empty cells to all candidates.
   * @param {number[]} board Encoded board values.
   */
  _resetEmptyCells() {
    this._board = this._board.map((val) => (isDigit(val) ? val : ALL));
    // TODO Does anything need to be done with the constraints?
  };

  /**
   *
   * @returns {boolean}
   */
  _reduce() {
    let boardSolutionChanged = false;
    let hadReduction = false;

    do {
      hadReduction = false;
      for (let i = 0; i < SPACES; i++) {
        hadReduction ||= this._reduce2(i);
        if (hadReduction) {
          // console.log(`reduced> ${boardSolution.board.map(decode).join('').replace(/0/g, '.')}`);
        }
        boardSolutionChanged ||= hadReduction;
      }
    } while (hadReduction);

    return boardSolutionChanged;
  }

  /**
   *
   * @param {number} cellIndex
   * @returns {boolean}
   */
  _reduce2(cellIndex) {
    const candidates = this._board[cellIndex];

    if (isDigit(candidates) || candidates <= 0) {
      return false;
    }

    // ? If candidate constraints reduces to 0, then the board is likely invalid.
    // TODO Reason out and test what happens when the board is invalid.
    let reducedCandidates = (candidates & ~this._cellConstraints(cellIndex));
    if (reducedCandidates <= 0) {
      // console.log(`reduce ${cellIndex} (${cellRow(cellIndex) + 1},${cellCol(cellIndex) + 1}): [${decode(candidates)}].  constraints reduced to 0... ERROR ERROR ERROR`);
      this.setDigit(0, cellIndex);
      return false;
    }

    // If by applying the constraints, the number of candidates is reduced to 1,
    // then the cell is solved.
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

    if (reducedCandidates < candidates) {
      this._reduceNeighbors(cellIndex);
    }

    // Whether candidates for the given cell have changed.
    return candidates != this._board[cellIndex];
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
   *
   * @param {number} cellIndex
   */
  _reduceNeighbors(cellIndex) {
    for (let ni of CELL_NEIGHBORS[cellIndex]) {
      this._reduce2(ni);
    }
  }

  /**
   * Finds the index of an empty cell which contains the fewest candidates.
   * @return {number} Cell index, or `-1` if there are no empty cells.
   */
  _pickEmptyCell() {
    if (this._numEmptyCells === 0) {
      return -1;
    }

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
    if (this.numEmptyCells > SPACES - MIN_CLUES) {
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
    const result = this.searchForSolutions2({
      solutionFoundCallback: (_solution) => {
        const keepGoing = (solution === null);
        solution = _solution;
        return keepGoing;
      }
    });

    if (result.complete && solution !== null) {
      this.setBoard(solution.board);
      // TODO Remove below once verified.
      // this._board = [...results[0]._board];
      // this._constraints = [...results[0]._constraints];
      // this._clues = results[0].clues;
      // this._numEmptyCells = results[0]._numEmptyCells;
      // return true;
    }

    return (result.complete && solution !== null);
  }

  /**
   * TODO Not yet implemented.
   *
   * Determines whether this puzzle is in a prime invalid form.
   *
   * Prime invalid form means that the puzzle is unresolvable and each empty cell,
   * when filled in with the corresponding value from the config, results in a puzzle
   * that has a unique solution (the given config).
   * @param {Sudoku} config
   * @returns {boolean}
   */
  isPrimeInvalid(config) {
    // TODO
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

  /**
   * Finds all unavoidable sets (UAs) in this puzzle.
   * @param {bigint} mask A mask for the initial puzzle to search for UAs.
   * @returns {bigint[]} An array of masks representing the UAs found.
   */
  findUAs(mask) {
    return this.filter(mask).searchForSolutions2().solutions.reduce((acc, solution) => {
      if (this.diff(solution) > 0n) {
        acc.push(this.diff(solution));
      }
      return acc;
    });
  }

  // TODO Cache fingerprints until board changes. Maybe make these getters.
  fingerprint_d(level) {
    if (!this.isConfig()) {
      throw new Error('Invalid configuration.');
    }

    if (level < 2 || level > 4) {
      throw new Error('Unsupported level. [2 <= level <= 4]');
    }

    const _board = this.board;
    const ss = new SudokuSieve({ config: this });

    const nck = nChooseK(DIGITS, level);
    for (let r = 0n; r < nck; r++) {
      const dCombo = Number(bitCombo(DIGITS, level, r));
      const mask = _board.reduce((pMask, d, ci) => (
        (digitMask(d) & dCombo) ? (pMask |= cellMask(ci)) : pMask
      ), 0n);
      ss.addFromMask(~mask);

      // Build masks with rows, cols, regions encoded in dCombo removed
      let rowMask = (1n << BigInt(SPACES)) - 1n;
      let colMask = (1n << BigInt(SPACES)) - 1n;
      let regionMask = (1n << BigInt(SPACES)) - 1n;
      for (let ci = 0; ci < SPACES; ci++) {
        if ((dCombo & (1 << CELL_ROWS[ci])) > 0) {
          rowMask &= ~cellMask(ci);
        }
        if ((dCombo & (1 << CELL_COLS[ci])) > 0) {
          colMask &= ~cellMask(ci);
        }
        if ((dCombo & (1 << CELL_REGIONS[ci])) > 0) {
          regionMask &= ~cellMask(ci);
        }
      }
      ss.addFromMask(rowMask);
      ss.addFromMask(colMask);
      ss.addFromMask(regionMask);
    }

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
}

export default Sudoku;
