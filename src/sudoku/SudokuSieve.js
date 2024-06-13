// import { shuffle } from '../util/arrays.js';
import Sudoku from './Sudoku.js';

/**
 * @param {number} cellIndex
 * @returns {bigint}
 */
function cellMask(cellIndex) {
  return 1n << (80n - BigInt(cellIndex));
}

/**
 * @param {bigint} mask
 * @returns {number[]}
 */
function cellsFromMask(mask) {
  const cells = [];
  let ci = 80;
  while (mask > 0n) {
    if (mask & 1n) {
      cells.push(ci);
    }
    mask >>= 1n;
    ci--;
  }
  return cells;
}

// TODO Keep track of items in a 2D array, indexed by [num cells]

export default class SudokuSieve {
  /**
   *
   * @param {object} options
   * @param {Sudoku} options.config
   * @param {bigint[]} options.items
   */
  constructor({ config, items = [] }) {
    this._config = new Sudoku(config);
    /** @type {bigint[][]} */
    this._items = Array(81).fill(0).map(_=>[]);
    this._length = 0;

    /**
     * @typedef {object} Cell
     * @property {number} ci
     * @property {number} descIndex
     * @property {number} count
     */
    /** @type {Cell[]} */
    this._redmat = Array(81).fill(0).map((_, i) => ({ ci: i, descIndex: i, count: 0 }));
    /** @type {Cell[]} */
    this._cellsDescCount = [...this._redmat];
    this._cellSum = 0;

    if (items.length > 0) {
      this.add(...items);
    }
  }

  /**
   * @type {Sudoku}
   */
  get config() {
    return new Sudoku(this._config);
  }

  /**
   * @type {bigint[]}
   */
  get items() {
    return this._items.flat();
  }

  /**
   * @type {number}
   */
  get length() {
    return this._length;
  }

  /** @type {bigint} */
  get first() {
    return (this._length > 0) ? this._items.find(subarr => subarr.length > 0)[0] : 0n;
  }

  /**
   *
   * @param {bigint} mask
   * @returns {number}
   */
  _numCells(mask) {
    let result = 0;
    while (mask > 0n) {
      if (mask & 1n) {
        result++;
      }
      mask >>= 1n;
    }
    return result;
  }

  _itemsFor(mask) {
    return this._items[this._numCells(mask)];
  }

  /**
   *
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
   *
   * @param {bigint} item
   */
  _addItemToMatrix(item) {
    for (let ci = 0; ci < 81; ci++) {
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
    for (let ci = 0; ci < 81; ci++) {
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
      if (!this._itemsFor(item).includes(item) && !this._isDerivative(item)) {
        added = true;
        this._itemsFor(item).push(item);
        this._addItemToMatrix(item);
        this._length++;
      }
    }
    this._removeDerivatives();
    return added;
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
   *
   * Only a single overlapping bit is necessary for an item to be removed.
   * @param {bigint} mask
   * @returns {bigint[]}
   */
  removeOverlapping(mask) {
    /** @type {bigint[]} */
    const removed = [];

    for (let numCells = 0; numCells < 81; numCells++) {
      const subArr = this._items[numCells];
      if (subArr && subArr.length > 0) {
        this._items[numCells] = subArr.filter((item) => {
          if ((item & mask) > 0n) {
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
  _isDerivative(mask) {
    return this._items.some(subItems => subItems.some(item => (item & mask) === item));

    // return this._itemsFor(mask).some(item => (item & mask) === item);
    // for (const other of this._items) {
    //   if ((item & other) === other) {
    //     return true;
    //   }
    // }
    // return false;
  }

  /**
   * Removes and returns all derivative items, and return true if any were removed.
   *
   * An item 'A' is a derivative 'B' if all the on bits of 'A' are also on bits of 'B'.
   * @returns {boolean}
   */
  _removeDerivatives() {
    // let changed = false;

    const beforeLength = this._length;
    /** @type {bigint[]} */
    const removed = [];

    // Remove duplicates
    // const beforeLength = this._items.length;
    // this._items = [...new Set(this._items)];
    // const afterLength = this._items.length;
    // if (beforeLength !== afterLength) {
    //   changed = true;
    // }

    for (let numCells = 0; numCells < 81; numCells++) {
      const itemsSubArray = this._items[numCells];
      if (itemsSubArray.length === 0) {
        continue;
      }

      for (let i = 0; i < itemsSubArray.length; i++) {
        const item = itemsSubArray[i];
        if (removed.includes(item)) {
          continue;
        }

        // Check the rest of itemsSubArray
        for (let j = i + 1; j < itemsSubArray.length; j++) {
          const other = itemsSubArray[j];
          if ((item & other) === other) {
            removed.push(item);
            break;
          } else if ((item & other) === item) {
            removed.push(other);
          }
        }

        // Then check the remaining subarrays
        for (let _numCells = numCells + 1; _numCells < 81; _numCells++) {
          const _itemsSubArray = this._items[_numCells];
          if (_itemsSubArray.length === 0) {
            continue;
          }

          for (let j = 0; j < _itemsSubArray.length; j++) {
            const other = _itemsSubArray[j];
            if ((item & other) === other) {
              removed.push(item);
              break;
            } else if ((item & other) === item) {
              removed.push(other);
            }
          }
        }
      }

      this._items[numCells] = itemsSubArray.filter((item) => {
        if (removed.includes(item)) {
          this._removeItemFromMatrix(item);
          this._length--;
          removed.splice(removed.findIndex(_item => _item === item), 1);
          return false;
        }
        return true;
      });
    }

    return this._length !== beforeLength;
  }

  /**
   *  TODO This will become a getter
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
  // /**
  //  *  TODO This will become a getter
  //  * @returns {{
  //  *    matrix: number[],
  //  *    maximum: number,
  //  *    maximumCells: number[]
  //  * }}
  //  */
  // reductionMatrix() {
  //   const result = {
  //     /** @type {number[]} */
  //     matrix: Array(81).fill(0),
  //     maximum: 0,
  //     /** @type {number[]} */
  //     maximumCells: []
  //   };

  //   this._items.forEach((mask) => {
  //     for (let ci = 0; ci < 81; ci++) {
  //       if (mask & cellMask(ci)) {
  //         result.matrix[ci]++;

  //         if (result.matrix[ci] > result.maximum) {
  //           result.maximum = result.matrix[ci];
  //           result.maximumCells = [ci];
  //         } else if (result.matrix[ci] === result.maximum) {
  //           result.maximumCells.push(ci);
  //         }
  //       }
  //     }
  //   });

  //   shuffle(result.maximumCells);

  //   return result;
  // }

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
}

/**
 *
 * @param {SudokuSieve} sieve
 * @returns {{
 *    isValid: boolean,
 *    reason: string
 * }}
 */
export function validateSieve(sieve) {
  const results = {
    isValid: true,
    reason: 'valid'
  };

  const config = sieve.config;

  if (!config.isConfig()) {
    config.isValid = false;
    config.reason = `sieve config is invalid: [${config.toString()}]`;
  } else {
    // Each item must have solutionFlag = 1, and each

  }

  return results;
}
