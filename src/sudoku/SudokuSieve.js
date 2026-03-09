// import { shuffle } from '../util/arrays.js';
import { bitCombo, nChooseK } from '@metal-pony/counting-js';
import { range } from '../util/arrays.js';
import Sudoku, {
  ALL,
  cellMask,
  digitMask,
  SearchState,
} from './Sudoku.js';


/**
 *
 * @param {number} value
 */
function _countBits(value) {
  let count = 0;
  while (value > 0) {
    if (value & 1) count++;
    value >>= 1;
  }
  return count;
}

/**
 * @param {bigint} mask
 */
function _countBigBits(mask) {
  let count = 0;
  while (mask > 0n) {
    if (mask & 1n) count++;
    mask >>= 1n;
  }
  return count;
}

const DIGITS = 9;
const SPACES = 81;
const MIN_LEVEL = 2;
const MAX_LEVEL = 4;
const CELL_MASKS = range(SPACES).map((ci) => (1n << (BigInt(SPACES - ci - 1))));
const FULL_MASK = (1n << BigInt(SPACES)) - 1n;

// TODO Repeated functions with Sudoku, needed for static intialization.
const cellRow = (cellIndex) => (cellIndex / DIGITS) | 0;
const cellCol = (cellIndex) => cellIndex % DIGITS;
const cellRegion = (cellIndex) => ((cellIndex / 27) | 0) * 3 + (((cellIndex % 9) / 3) | 0);

/** @type {bigint[][]} */
const ROW_COMBO_MASKS = Array(MAX_LEVEL + 1).fill(0).map(_=>[]);
/** @type {bigint[][]} */
const COL_COMBO_MASKS = Array(MAX_LEVEL + 1).fill(0).map(_=>[]);
/** @type {bigint[][]} */
const REGION_COMBO_MASKS = Array(MAX_LEVEL + 1).fill(0).map(_=>[]);
/** @type {bigint[][]} */
const ALL_AREA_COMBO_MASKS = Array(MAX_LEVEL + 1).fill(0).map(_=>[]);
/** @type {number[][]} */
const DCMASKS_FOR_LEVEL = Array(DIGITS + 1).fill(0).map(_=>[]);
for (let v = 0; v <= 511; v++) {
  DCMASKS_FOR_LEVEL[_countBits(v)].push(v);
}

for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
  const nck = nChooseK(DIGITS, level);
  for (let r = 0n; r < nck; r++) {
    const combo = Number(bitCombo(DIGITS, level, r));
    let rowMask = FULL_MASK;
    let colMask = FULL_MASK;
    let regionMask = FULL_MASK;

    for (let ci = 0; ci < SPACES; ci++) {
      if (combo & (1 << cellRow(ci))) rowMask &= ~CELL_MASKS[ci];
      if (combo & (1 << cellCol(ci))) colMask &= ~CELL_MASKS[ci];
      if (combo & (1 << cellRegion(ci))) regionMask &= ~CELL_MASKS[ci];
    }

    ROW_COMBO_MASKS[level].push(rowMask);
    COL_COMBO_MASKS[level].push(colMask);
    REGION_COMBO_MASKS[level].push(regionMask);
    ALL_AREA_COMBO_MASKS[level].push(rowMask, colMask, regionMask);
  }
}

/**
 * Gets the masks for all combinations of `level`(2 - 4) areas of a sudoku board.
 * 'Areas' being rows, columns, and regions.
 * Different types of areas are not combined - each combo will
 * only include rows, or only include columns, or only include regions.
 * @param {number} level Number of rows, columns, or regions in each combo.
 */
export function getAreaComboMasks(level) {
  if (level < MIN_LEVEL || level > MAX_LEVEL) {
    throw new Error(`Invalid level: ${level}. Level must be between ${MIN_LEVEL} and ${MAX_LEVEL}.`);
  }
  return [...ALL_AREA_COMBO_MASKS[level]];
}

/**
 * Generates the masks for all combinations of `level`(2 - 4) digits
 * in the given sudoku board.
 * @param {Sudoku} config Sudoku board. Assumed to be a valid configuration.
 * @param {number} level Number of digits in each combo.
 */
export function getDigitComboMasks(config, level) {
  const boardDigits = config.board;
  return DCMASKS_FOR_LEVEL[level].map(dc => {
    const m = boardDigits.reduce((mask, d, ci) => {
      if (dc & digitMask(d)) {
        mask &= ~CELL_MASKS[ci];
      }
      return mask;
    }, FULL_MASK);

    return m;
  });
}

/**
 * Filters `grid` with `mask` to create a puzzle, then adds all derived unavoidable sets
 * from the puzzle's solutions into `sieve`.
 * @param {Sudoku} grid The full sudoku grid to search unavoidable sets for.
 * @param {bigint[]} sieve An existing array to accumulate unavoidable sets.
 * @param {bigint} mask An 81-bit puzzle mask.
 * @param {boolean} announce (Default `false`) Whether to log the unavoidable sets.
 */
export function searchForItemsFromMask(grid, sieve, mask, announce = false) {
  const search = new SearchState(grid.filter(mask));
  while (search.advanceToSolution()) {
    const diff = grid.diff(search.solution);
    // Filter out solutions that are the original grid
    if (diff === 0n) continue;

    // Filter out solutions already covered by an existing sieve item
    for (const item of sieve) if ((item & diff) === item) continue;

    // Now, for a diff to be considered a sieve item...
    // (1) it must not be reducible
    const p = grid.filter(~diff);
    const pEmptyCells = p._numEmptyCells;
    p._reduce();
    if (p.numEmptyCells !== pEmptyCells) continue;

    // (2) it must have multiple solutions
    // IGNORED: A diff puzzle will always have multiple solutions.
    // if (p.solutionsFlag() !== 2) continue;

    // (3) for each empty cell, filling it with one of its remaining candidates and solving yields a solution
    if (!p.allAntiesSolve()) continue;

    // We've made it this far, so this diff is an Unavoidable Set ('UA' or 'sieve item')
    sieve.push(diff);
    if (announce) console.log(`+ ${grid.filter(diff).toString()}`);
  }
}

/**
 * Seeds a sieve array with the digitCombos algorithm and the specified level.
 * @param {object} options
 * @param {Sudoku} options.grid The grid that the sieve is meant for.
 * @param {bigint[]} options.sieve (Optional, Default new array) The array to populate.
 * @param {number} options.level (Default `2`) Between `2` and `4`.
 * @returns {bigint[]} The sieve populated with items, sorted.
 */
export function seedSieveDc({ grid, sieve = [], level = 2 }) {
  if (level < MIN_LEVEL || level > MAX_LEVEL) {
    throw new Error(`Invalid level: ${level}. Level must be between ${MIN_LEVEL} and ${MAX_LEVEL}.`);
  }
  const nck = nChooseK(DIGITS, level);
  const _board = grid.board;

  for (let r = 0n; r < nck; r++) {
    const dCombo = Number(bitCombo(DIGITS, level, r));
    let digMask = FULL_MASK;
    for (let ci = 0; ci < SPACES; ci++) {
      if ((dCombo & digitMask(_board[ci])) > 0) digMask &= ~CELL_MASKS[ci];
    }
    searchForItemsFromMask(grid, sieve, digMask);
  }

  return sortSieve(sieve);
}

/**
 * Seeds a sieve array with the fullCombo algorithm and the specified level.
 * @param {object} options
 * @param {Sudoku} options.grid The grid that the sieve is meant for.
 * @param {bigint[]} options.sieve (Optional) The array to populate.
 * @param {number} options.level (Default `2`) Between `2` and `4`.
 * @returns {bigint[]} The sieve populated with items, sorted.
 */
export function seedSieveFp({ grid, sieve = [], level = 2 }) {
  if (level < MIN_LEVEL || level > MAX_LEVEL) {
    throw new Error(`Invalid level: ${level}. Level must be between ${MIN_LEVEL} and ${MAX_LEVEL}.`);
  }

  sieve.push(...seedSieveDc({ grid, sieve, level }));

  ALL_AREA_COMBO_MASKS[level].forEach(mask => searchForItemsFromMask(grid, sieve, mask));

  return sortSieve(sieve);
}

/**
 *
 * @param {bigint[]} sieve
 */
export function sortSieve(sieve) {
  return sieve.sort((a, b) => {
    const aBits = _countBigBits(a);
    const bBits = _countBigBits(b);
    if (aBits > bBits) return 1;
    if (bBits > aBits) return -1;
    if (aBits === bBits) return (a === b) ? 0 : (a > b) ? 1 : -1;
  });
}

/**
 * Validates the given items for the configuration.
 * @param {Sudoku} config
 * @param  {bigint} item
 * @returns {boolean}
 */
function _validate(config, item) {
  const p = config.filter(~item);
  // Must not reduce further
  const pEmptyCells = p._numEmptyCells;
  p._reduce();
  if (p.numEmptyCells !== pEmptyCells) return false;

  // Every antiderivative must have a single solution
  return p.allAntiesSolve();
}

export default class SudokuSieve {
  /**
   * TODO: Adapt to allow copy constructor.
   * @param {object} options
   * @param {Sudoku} options.config
   * @param {bigint[]} options.items
   */
  constructor({ config, items = [] }) {
    if (
      !Boolean(config) ||
      !(config instanceof Sudoku) ||
      !config.isSolved()
    ) {
      throw new Error('Given config is not valid.');
    }

    this._config = new Sudoku(config);
    this._configBoard = this._config.board;

    /**
     * number[0 to 81]bigint[]
     * @type {bigint[][]}
     */
    this._items = Array(SPACES).fill(0).map(_=>[]);
    this._length = 0;

    /** @type {number[]} */
    this._reductionMatrix = Array(SPACES).fill(0);
    this._modified = false;

    /**
     * @typedef {object} Cell
     * @property {number} ci
     * @property {number} descIndex
     * @property {number} count
     */
    /** @type {Cell[]} */
    this._redmat = Array(SPACES).fill(0).map((_, i) => ({ ci: i, descIndex: i, count: 0 }));
    /** @type {Cell[]} */
    this._cellsDescCount = [...this._redmat];
    this._cellSum = 0;

    if (items.length > 0) {
      items.forEach(item => this.rawAdd(item));
    }

    /**
     * Keeps track of which items need to be validated.
     * @type {bigint[]}
     */
    this._needsValidating = [];

    /**
     * Keeps track of which items have been validated. Parallel to _items.
     * @type {bigint[][]}
     */
    this._validated = Array(SPACES).fill(0).map(_=>[]);
  }

  /** The configuration of this sieve.*/
  get config() { return this._config; }
  /** An array containing the sieve items, sorted by UAset chain length.*/
  get items() { return this._items.flat(); }
  /** The number of items in this sieve.*/
  get length() { return this._length; }
  /** Gets an artibrary sieve item among those grouped by the least chain length.*/
  get first() {
    return (this._length > 0) ? this._items.find(subarr => subarr.length > 0)[0] : 0n;
  }
  /** True if and only if all items have been validated.*/
  get validated() { return this._needsValidating.length === 0; }

  /**
   * A count for the number of times each cell appears as a sieve item.
   */
  get reductionMatrix() {
    if (this._modified) {
      this._reductionMatrix.fill(0);
      this.items.forEach(item => {
        for (let ci = 0; ci < SPACES; ci++) {
          if ((item & CELL_MASKS[ci]) > 0n) {
            this._reductionMatrix[ci]++;
          }
        }
      });
    }
    this._modified = false;

    return [...this._reductionMatrix];
  }

  /**
   * Counts the number of unique digits in the given board mask.
   * @param {bigint} mask
   * @returns {number}
   */
  _countMaskDigits(mask) {
    let result = 0;
    let track = 0;
    let ci = 80;
    let d = 0;
    while (mask > 0n) {
      d = digitMask(this._configBoard[ci]);
      if ((mask & 1n) && !(track & d)) {
        result++;
        track |= d;
      }
      mask >>= 1n;
      ci--;
    }
    return result;
  }

  /**
   *
   * @param {cg} mask
   * @returns
   */
  _itemsFor(mask) {
    return this._items[_countBigBits(mask)];
  }

  /**
   * TODO Constant time solution
   * @param {bigint} mask
   * @returns {boolean}
   */
  has(mask) {
    return this._itemsFor(mask).includes(mask);
  }

  /**
   * Determines whether the given mask satisfies all items in the sieve.
   *
   * TODO Test
   * @param {bigint} mask
   * @returns {boolean} true if the mask satisfies all items in the sieve; otherwise false.
   */
  doesMaskSatisfy(mask) {
    for (let group of this._items) {
      for (let item of group) {
        if (!(item & mask)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   *
   * @param {bigint} item
   */
  _addItemToMatrix(item) {
    for (let ci = 0; ci < SPACES; ci++) {
      if (item & cellMask(ci)) {
        this._reductionMatrix[ci]++;
      }
    }
  }

  /**
   *
   * @param {bigint} item
   */
  _removeItemFromMatrix(item) {
    for (let ci = 0; ci < SPACES; ci++) {
      if (item & cellMask(ci)) {
        this._reductionMatrix[ci]--;
      }
    }
  }

  /**
   * Adds an item to the sieve without validation.
   * @param {bigint} item
   */
  rawAdd(item) {
    if (!this._itemsFor(item).includes(item)) {
      this._itemsFor(item).push(item);
      this._length++;
      this._modified = true;
      return true;
    }
    return false;
  }

  /**
   * Adds an item to the sieve if valid and non-derivative.
   * @param {bigint} item Items to add.
   * @returns {boolean} True if the item was added.
   */
  add(item) {
    if (this.isDerivative(item) || !_validate(this._config, item)) {
      return false;
    }

    this._itemsFor(item).push(item);
    this._length++;
    this._modified = true;
    return true;
  }

  /**
   * Generates sieve items from the given board mask and adds them if not yet acquired.
   * @param {bigint} mask
   * @param {(item: bigint)=>void} itemFoundCallback
   * @returns {number} The number of items added.
   */
  addFromMask(mask, itemFoundCallback = null) {
    const initialSieveSize = this._length;
    const puzzle = this._config.filter(mask);
    puzzle.forEachSolution((solution) => {
      const diff = this._config.diff(solution);
      if (diff > 0n) {
        if (this.add(diff)) {
          if (itemFoundCallback) {
            itemFoundCallback(diff);
          }
        }
      }
    });

    return (this._length - initialSieveSize);
  }

  /**
   * Removes and returns all items from this sieve that have bits overlapping with the given mask.
   * TODO Rename to 'reduce'
   *
   * Only a single overlapping bit is necessary for an item to be removed.
   * @param {bigint} mask
   * @returns {bigint[]}
   */
  removeOverlapping(mask) {
    /** @type {bigint[]} */
    const removed = [];

    for (let numCells = 0; numCells < SPACES; numCells++) {
      const subArr = this._items[numCells];
      if (subArr && subArr.length > 0) {
        this._items[numCells] = subArr.filter((item) => {
          if (item & mask) {
            removed.push(item);
            this._length--;
            this._modified = true;
            return false;
          }
          return true;
        });
      }
    }

    return removed;
  }

  /**
   * Determines whether the given mask is a derivative of any other sieve item
   * or already exists in the sieve.
   * @param {bigint} mask
   * @returns {boolean}
   */
  isDerivative(mask) {
    if (mask === 0n) return true;

    for (let group of this._items) {
      for (let item of group) {
        if ((item & mask) === item) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * @type {string}
   */
  toString() {
    let strb = '{\n';

    const itemsLen = this._items.length;
    for (let m = 0; m < itemsLen; m++) {
      const group = this._items[m];
      if (group.length > 0) {
        strb += `  [${m}]: [\n`;
        for (let item of group) {
          strb += `    ${this._config.filter(item).toString()}\n`;
        }
        strb += '  ],\n';
      }
    }

    strb += '}';
    return strb;
  }

  /**
   * Seeds the sieve with items generated from the given masks.
   * @param {bigint[]} masks
   * @param {(item: bigint)=>void} itemFoundCallback
   */
  seedFromMasks(masks, itemFoundCallback = null) {
    masks.forEach(mask => this.addFromMask(mask, itemFoundCallback));
    this._sortInGroups();
  }

  _sortInGroups() {
    for (let group of this._items) {
      group.sort((a, b) => (a === b) ? 0 : (a > b) ? 1 : -1);
    }
  }

  /**
   * Generates the masks for all combinations of `level`(2 - 4) digits
   * in the config's board.
   * @param {number} level Number of digits in each combo.
   */
  getDigitComboMasks(level) {
    return getDigitComboMasks(this._config, level);
  }

  /**
   * Generates the masks for all combinations of `level`(2 - 4) areas
   * and digits in the config's board.
   * See `getAreaComboMasks` for combos of areas only.
   * @param {number} level Number of areas/digits in each combo.
   */
  getFullComboMasks(level) {
    return [
      ...ALL_AREA_COMBO_MASKS[level],
      ...this.getDigitComboMasks(level)
    ];
  }
}
