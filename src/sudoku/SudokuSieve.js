// import { shuffle } from '../util/arrays.js';
import { range } from '../util/arrays.js';
import { bitCombo, nChooseK } from '../util/perms.js';
import Sudoku, {
  cellCol,
  cellMask,
  cellRegion,
  cellRow,
  digitMask,
  DIGITS,
  SPACES
} from './Sudoku.js';

/**
 * @param {bigint} mask
 * @returns {number}
 */
function _countBits(mask) {
  return (mask.toString(2).match(/1/g) || []).length;
}

const CELL_MASKS = range(81).map((ci) => (1n << (BigInt(81 - ci - 1))));

/**
 * Filters `grid` with `mask` to create a puzzle, then adds all derived unavoidable sets
 * from the puzzle's solutions into `sieve`.
 * @param {Sudoku} grid The full sudoku grid to search unavoidable sets for.
 * @param {bigint[]} sieve An existing array to accumulate unavoidable sets.
 * @param {bigint} mask An 81-bit puzzle mask.
 * @param {boolean} announce (Default `false`) Whether to log the unavoidable sets.
 */
export function searchForItemsFromMask(grid, sieve, mask, announce = false) {
  grid.filter(mask).searchForSolutions2({
    solutionFoundCallback: (solution) => {
      const diff = grid.diff(solution);

      // Filter out solutions that are the original grid
      if (diff === 0n) return true;
      // Filter out solutions already covered by an existing sieve item
      for (const item of sieve) if ((item & diff) === item) return true;
      // Now, for a diff to be considered a sieve item...
      // (1) it must not be reducible
      const p = grid.filter(~diff);
      const pEmptyCells = p._numEmptyCells;
      p._reduce();
      if (p.numEmptyCells !== pEmptyCells) return true;
      // (2) it must have multiple solutions
      if (p.solutionsFlag() !== 2) return true;
      // (3) for each empty cell, filling it with one of its remaining candidates and solving yields a solution
      if (!p.allAntiesSolve()) return true;

      // We've made it this far, so this diff is an Unavoidable Set ('UA' or 'sieve item')
      sieve.push(diff);
      if (announce) console.log(`+ ${grid.filter(diff).toString()}`);

      return true;
    }
  });
}

/**
 * Seeds a sieve array to a given level.
 * @param {object} options
 * @param {Sudoku} options.grid (! REQUIRED !)
 * @param {bigint[]} options.sieve (Optional, Default new array) The array to populate.
 * @param {number} options.level (Default `2`) Recommended `2 <= level <= 4`.
 *
 * Typical modern cpu (2025): Level 2 is fairly instant. 3 should be take less than 1s, 4 may take up to a minute.
 * @returns {bigint[]} The sieve populated with items.
 */
export function seedSieve({ grid, sieve = [], level = 2 }) {
  const nck = nChooseK(DIGITS, level);
  const _board = grid.board;
  const fullMask = (1n << BigInt(SPACES)) - 1n;

  for (let r = 0n; r < nck; r++) {
    const dCombo = Number(bitCombo(DIGITS, level, r));

    let digMask = fullMask;
    let rowMask = fullMask;
    let colMask = fullMask;
    let regionMask = fullMask;

    for (let ci = 0; ci < SPACES; ci++) {
      if ((dCombo & digitMask(_board[ci])) > 0) digMask &= ~CELL_MASKS[ci];
      if ((dCombo & (1 << cellRow(ci))) > 0) rowMask &= ~CELL_MASKS[ci];
      if ((dCombo & (1 << cellCol(ci))) > 0) colMask &= ~CELL_MASKS[ci];
      if ((dCombo & (1 << cellRegion(ci))) > 0) regionMask &= ~CELL_MASKS[ci];
    }

    searchForItemsFromMask(grid, sieve, digMask);
    searchForItemsFromMask(grid, sieve, rowMask);
    searchForItemsFromMask(grid, sieve, colMask);
    searchForItemsFromMask(grid, sieve, regionMask);
  }

  return sieve;
}

/**
 * Validates the given items for the configuration.
 * @param {Sudoku} config
 * @param  {bigint} item
 * @returns {boolean}
 */
function _validate(config, item) {
  const p = config.filter(~item);
  const pEmptyCells = p._numEmptyCells;
  p._reduce();

  return (
    // Must not reduce further
    (p.numEmptyCells === pEmptyCells) &&
    // Must have multiple solutions
    (p.solutionsFlag() === 2) &&
    // Every antiderivative must have a single solution
    p.allAntiesSolve()
  );
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
      !config.isConfig()
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
      items.forEach(item => this.add(item));
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
    return this._items[_countBits(mask)];
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
        if ((item & mask) === 0n) {
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
      if ((item & cellMask(ci)) > 0n) {
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
      if ((item & cellMask(ci)) > 0n) {
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
    const initialCount = this._length;
    const puzzle = this._config.filter(mask);
    puzzle.searchForSolutions2({
      solutionFoundCallback: (solution) => {
        const diff = this._config.diff(solution);
        if (diff > 0n) {
          if (this.add(diff)) {
            if (itemFoundCallback) {
              itemFoundCallback(diff);
            }
          }
        }
        return true;
      }
    });

    return (this._length - initialCount);
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
    if (mask === 0n) {
      return true;
    }

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
   *
   * @param {number} level
   * @param {(item: bigint)=>void} itemFoundCallback
   */
  seed(level, itemFoundCallback = null) {
    const nck = nChooseK(DIGITS, level);
    const _board = this._config.board;
    const fullMask = (1n << BigInt(SPACES)) - 1n;
    for (let r = 0n; r < nck; r++) {
      const dCombo = Number(bitCombo(DIGITS, level, r));

      let digMask = fullMask;
      let rowMask = fullMask;
      let colMask = fullMask;
      let regionMask = fullMask;

      for (let ci = 0; ci < SPACES; ci++) {
        if ((dCombo & digitMask(_board[ci])) > 0) {
          digMask &= ~CELL_MASKS[ci];
        }
        if ((dCombo & (1 << cellRow(ci))) > 0) {
          rowMask &= ~CELL_MASKS[ci];
        }
        if ((dCombo & (1 << cellCol(ci))) > 0) {
          colMask &= ~CELL_MASKS[ci];
        }
        if ((dCombo & (1 << cellRegion(ci))) > 0) {
          regionMask &= ~CELL_MASKS[ci];
        }
      }
      this.addFromMask(digMask, itemFoundCallback);
      this.addFromMask(rowMask, itemFoundCallback);
      this.addFromMask(colMask, itemFoundCallback);
      this.addFromMask(regionMask, itemFoundCallback);
    }

    this._sortInGroups();
  }

  _sortInGroups() {
    for (let group of this._items) {
      group.sort((a, b) => (a === b) ? 0 : (a > b) ? 1 : -1);
    }
  }
}
