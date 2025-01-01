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
  return (
    // Must not be reducible
    !p._reduce() &&
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
      this.add(...items);
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

  filter(predicate) {
    return this.items.filter(predicate);
  }

  forEach(callback) {
    this.items.forEach(callback);
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
   * Adds each item to the sieve. If the sieve was changed as a result, returns true.
   * @param {bigint[]} items Variable abount of items to add.
   * @returns {boolean} True if any items were added.
   */
  add(...items) {
    let added = false;
    for (const item of items) {
      if (this.isDerivative(item) || !_validate(this._config, item)) {
        continue;
      }

      added = true;
      this._itemsFor(item).push(item);
      // this._addItemToMatrix(item);
      this._length++;
    }

    return added;
  }

  /**
   * Generates sieve items from the given board mask and adds them if not yet acquired.
   * @param {bigint} mask
   * @returns {number} The number of items added.
   */
  addFromMask(mask) {
    const initialCount = this._length;
    const puzzle = this._config.filter(mask);
    puzzle.searchForSolutions2({
      solutionFoundCallback: (solution) => {
        const diff = this._config.diff(solution);
        if (diff > 0n) {
          this.add(diff);
        }
        return true;
      }
    });

    return (this._length - initialCount);
  }

  // /**
  //  *
  //  * @param {bigint} item
  //  */
  // remove(item) {
  //   this._items = this._items.filter((i) => i !== item);
  // }

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
   * TODO Take m as a parameter. Follow-up by keeping reduction matrices in memory
   * and updating them as needed.
   * @returns {{
   *    matrix: number[],
   *    maximum: number,
   *    maximumCells: number[]
   * }}
   */
  reductionMatrix() {
    return {
      matrix: this._redmat.map(cell => cell.count),
      maximum: this._cellsDescCount[0].count,
      maximumCells: this._cellsDescCount.map(cell => cell.ci)
    };
  }

  /**
   * TODO This function does not belong in this class.
   * TODO The sieve is used to generated this info, but it isn't
   * TODO responsible for generating it.
   *
   * @param {number} maxSelections
   * @param {number} maxAttempts
   * @returns {bigint}
   */
  _generateMask(maxSelections = 27, maxAttempts = 100) {
    let selectedCount = 0;
    let mask = 0n;
    let attempts = 0;
    const start = Date.now();

    do {
      selectedCount = 0;
      mask = 0n;
      let _sieve = new SudokuSieve({
        config: this._config,
        items: this.items
      });

      // For each sieve item, if the root puzzle overlaps with the sieve item, then add pick a cell from the sieve item
      // and add it to the root puzzle.
      while (_sieve.length > 0) {
        const { matrix, maximum, maximumCells } = _sieve.reductionMatrix();

        // Collect all the distinct cell indices in the matrix.
        // /** @type {{ci: number, count: number}[]} */
        // const allCells = matrix.reduce((_allCells, count, ci) => {
        //   if (count > 0) {
        //     _allCells.push({ ci, count: count });
        //   }
        //   return _allCells;
        // }, []).sort((a, b) => a.count - b.count);
        // // Sum the counts of all cells.
        // const countSum = allCells.reduce((sum, cell) => sum + cell.count, 0);
        // const countSum = _sieve._cellSum;

        // Generate a random number between 0 and the sum of the counts.
        // This will give us a random cell weighted by the count.
        // Higher count = higher chance of being selected.
        // const rand = Math.floor(Math.random() * countSum);
        // let chosenCell = null;
        // let sum = 0;
        // for (let i = 0; i < maximumCells.length; i++) {
        //   sum += matrix[maximumCells[i]];
        //   if (sum >= rand) {
        //     chosenCell = maximumCells[i];
        //     break;
        //   }
        // }

        const choices = maximumCells.slice(0, 8);
        const chosenCell = choices[Math.floor(Math.random() * choices.length)];
        if (chosenCell === null) {
          throw new Error('chosenCell is null');
        }

        // const nextCi = chosenCell;

        // Choose random cell from the maximum cells.
        // const nextCi = maximumCells[Math.floor(Math.random() * maximumCells.length)];
        selectedCount++;

        // mask |= (1n << BigInt(chosenCell));
        mask |= cellMask(chosenCell);
        _sieve.removeOverlapping(mask);
        // remainingItems = remainingItems.filter((item) => (item & mask) === 0n);
        // _sieve._items = _sieve._items.filter((item) => (item & mask) === 0n);
      }
      attempts++;
    } while (selectedCount > maxSelections); // && attempts++ < maxAttempts);

    // console.log(`_generateMask: took ${Date.now() - start}ms after ${attempts} attempts`);

    return mask;
  }

  /**
   * @param {number} maxSelections
   * @param {number} maxAttempts
   * @returns {bigint}
   */
  _generateMask2(maxSelections = 27, maxAttempts = 100) {
    let selectedCount = 0;
    let mask = 0n;
    let attempts = 0;
    // const start = Date.now();

    do {
      selectedCount = 0;
      mask = 0n;
      let _sieve = new SudokuSieve({
        config: this._config,
        items: this.items
      });

      // For each sieve item, if the root puzzle overlaps with the sieve item, then add pick a cell from the sieve item
      // and add it to the root puzzle.
      while (_sieve.length > 0) {
        // const choices = this._items.find(subarr => subarr.length > 0);
        // const itemChoice = choices[Math.floor(Math.random() * choices.length)];
        let cells = cellsFromMask(_sieve.first);
        const chosenCell = cells[Math.floor(Math.random() * cells.length)];
        if (chosenCell === null) {
          throw new Error('chosenCell is null');
        }

        // const nextCi = chosenCell;

        // Choose random cell from the maximum cells.
        // const nextCi = maximumCells[Math.floor(Math.random() * maximumCells.length)];
        selectedCount++;

        // mask |= (1n << BigInt(chosenCell));
        mask |= cellMask(chosenCell);
        _sieve.removeOverlapping(mask);
        // remainingItems = remainingItems.filter((item) => (item & mask) === 0n);
        // _sieve._items = _sieve._items.filter((item) => (item & mask) === 0n);
      }
      attempts++;
    } while (selectedCount > maxSelections); // && attempts++ < maxAttempts);

    // console.log(`_generateMask: took ${Date.now() - start}ms after ${attempts} attempts`);

    return mask;
  }

  /**
   * @param {number} maxSelections
   * @param {number} maxAttempts
   * @returns {number[]}
   */
  _generateMaskCells(maxSelections = 27, maxAttempts = 100) {
    return cellsFromMask(this._generateMask2(maxSelections, maxAttempts));
    // const mask = this._generateMask2(maxSelections, maxAttempts);
    // const cells = [];
    // for (let ci = 0; ci < 81; ci++) {
    //   if (mask && cellMask(ci) > 0n) {
    //     cells.push(ci);
    //   }
    // }
    // return cells;
  }

  /**
   *
   */
  validate() {
    /** @type {string[]} */
    const errors = [];
    const itemsLen = this._items.length;
    for (let i = 0; i < itemsLen; i++) {
      const subArrLen = this._items[i].length;
      for (let j = 0; j < subArrLen; j++) {
        const item = this._items[i][j];
        const p = this._config.filter(~item);
        const b = p.board;

        if (p._reduce()) {
          errors.push(
            `sieve item[${i}][${j}]: ${item}n; is reducable\n` +
            `            ${b.join('')}\n` +
            `  reduced > ${p.toString()}`
          );
          continue;
        }

        // Check that there are multiple solutions
        const pFlag = p.solutionsFlag();
        if (pFlag !== 2) {
          errors.push(`sieve item[${i}][${j}]: ${item}n; has pFlag = ${pFlag} (expected: 2)`);
          continue;
        }

        // For every antiderivative, check that it has a single or no solution
        for (const a of p.getAntiderivatives()) {
          const aFlag = a.solutionsFlag();
          if (aFlag === 0) {
            errors.push(`sieve item[${i}][${j}]: ${item}n; has no solution (expected: 1)`);
          } else if (aFlag > 1) {
            errors.push(`sieve item[${i}][${j}]: ${item}n; has multiple solutions (expected: 1)`);
          }
        }
      }
    }

    return errors;
  }

  /**
   * TODO Remove items from sieve instead of making a copy.
   * @param {options} options
   * @param {number} options.maxLength Maximum number of items to keep.
   * @param {number} options.maxCells
   * @param {number} options.maxDigits
   * @returns {SudokuSieve} A new SudokuSieve that's been pruned.
   */
  prune({ maxLength, maxCells = SPACES, maxDigits = 9 }) {
    maxLength ??= this.length;
    // TODO maxLength not used
    return this.items.filter((item) => (
      (this._countMaskCells(item) <= maxCells) &&
      (this._countMaskDigits(item) <= maxDigits)
    ));

  }

  /**
   * TODO Implement some sort of generation function to produce masks which satisfy the sieve.
   *
   * @param {*} param0
   */
  search({
    maxCells,
    maxDigits,
    validateOnAdd,
  }) {

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
   */
  seed(level) {
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

      this.addFromMask(digMask);
      this.addFromMask(rowMask);
      this.addFromMask(colMask);
      this.addFromMask(regionMask);
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
