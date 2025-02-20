// import { shuffle } from '../util/arrays.js';
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
    p.getAntiderivatives().every(a => a.solutionsFlag() === 1)
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
   * Returns the number of cells (number of 1 bits) in the given mask.
   * @param {bigint} mask
   * @returns {number}
   */
  _countMaskCells(mask) {
    let result = 0;
    while (mask > 0n) {
      if (mask & 1n) {
        result++;
      }
      mask >>= 1n;
    }
    return result;
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
    return this._items[this._countMaskCells(mask)];
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
        this._redmat[ci].count++;
        this._cellSum++;
        let i = this._redmat[ci].descIndex;
        while (i > 0 && this._cellsDescCount[i - 1].count < this._redmat[ci].count) {
          i--;
        }
        if (i < this._redmat[ci].descIndex) {
          let j = this._redmat[ci].descIndex;
          this._cellsDescCount[j] = this._cellsDescCount[i];
          this._cellsDescCount[i] = this._redmat[ci];
          this._cellsDescCount[j].descIndex = j;
          this._cellsDescCount[i].descIndex = i;
        }
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
        this._redmat[ci].count--;
        this._cellSum--;
        let i = this._redmat[ci].descIndex;
        while ((i < (this._cellsDescCount.length - 1)) && this._cellsDescCount[i + 1].count > this._redmat[ci].count) {
          i++;
        }
        if (i > this._redmat[ci].descIndex) {
          let j = this._redmat[ci].descIndex;
          this._cellsDescCount[j] = this._cellsDescCount[i];
          this._cellsDescCount[i] = this._redmat[ci];
          this._cellsDescCount[j].descIndex = j;
          this._cellsDescCount[i].descIndex = i;
        }
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
      return true;
    }
    return false;
  }

  /**
   * Adds an item to the sieve.
   * @param {bigint} item Items to add.
   * @returns {boolean} True if the item was added.
   */
  add(item) {
    if (this.isDerivative(item) || !_validate(this._config, item)) {
      return false;
    }

    this._itemsFor(item).push(item);
    // this._addItemToMatrix(item);
    this._length++;
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
            this._removeItemFromMatrix(item);
            this._length--;
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

  genSeedMasks() {
    const masks = [];
    for (let level = 1; level <= 9; level++) {
      const nck = nChooseK(DIGITS, level);
      const fullMask = (1n << BigInt(SPACES)) - 1n;
      for (let r = 0n; r < nck; r++) {
        const dCombo = Number(bitCombo(DIGITS, level, r));

        let digMask = fullMask;
        let rowMask = fullMask;
        let colMask = fullMask;
        let regionMask = fullMask;

        for (let ci = 0; ci < SPACES; ci++) {
          if ((dCombo & digitMask(_board[ci])) > 0) {
            digMask &= ~cellMask(ci);
          }
          if ((dCombo & (1 << cellRow(ci))) > 0) {
            rowMask &= ~cellMask(ci);
          }
          if ((dCombo & (1 << cellCol(ci))) > 0) {
            colMask &= ~cellMask(ci);
          }
          if ((dCombo & (1 << cellRegion(ci))) > 0) {
            regionMask &= ~cellMask(ci);
          }
        }

        masks.push(digMask);
        masks.push(rowMask);
        masks.push(colMask);
        masks.push(regionMask);
      }
    }

    return masks;
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
          digMask &= ~cellMask(ci);
        }
        if ((dCombo & (1 << cellRow(ci))) > 0) {
          rowMask &= ~cellMask(ci);
        }
        if ((dCombo & (1 << cellCol(ci))) > 0) {
          colMask &= ~cellMask(ci);
        }
        if ((dCombo & (1 << cellRegion(ci))) > 0) {
          regionMask &= ~cellMask(ci);
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

  /** @returns {Set<bigint>} */
  solveMasksForDiffs(masks) {
    const results = new Set();
    for (let mask of masks) {
      const p = this._config.filter(mask);
      p.searchForSolutions2({
        solutionFoundCallback: (solution) => {
          // results.push(solution);
          const diff = this._config.diff(solution);
          if (diff > 0n) {
            this.add(diff);
          }
          return true;
        }
      });
    }
    return results;
  }
}
