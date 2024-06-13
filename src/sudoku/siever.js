import { range } from '../util/arrays.js';
import Debugger from '../util/debug.js';
import {
  bitCombo,
  bitComboToR,
  nChooseK
} from '../util/perms.js';
import Sudoku, {
  cellCol,
  cellRegion,
  cellRegion2D,
  cellRow
} from './Sudoku.js';

const debug = new Debugger(false);

// Invalid Sudoku sieve
// The sieve contains contains 81 subarrays, each containing invalid puzzle bitmasks
// with the number of clues indicated via the index of the subarray.
// The sieve is built from the top down, starting with the maximum number of clues (80).
// Sieve items are stored as BigInts, with each bit representing a cell in the puzzle.
// All puzzles whose clues overlap with the bitmasks in the sieve are invalid derivatives
// and are not stored in the sieve.
// Not all subarrays will contain elements, as some clue counts may not have any invalid puzzles, eg, 80.

/**
 *
 * @param {Sudoku} config Sudoku configuration to use as the basis for the sieve
 * @param {number} minK Minimum number of clues to consider
 * @returns {BigInt[][]} The invalid puzzle sieve
 */
export function createSieve(config, minK = 77) {
  const _config = new Sudoku(config);

  /** @type {BigInt[][]} */
  let sieve = Array(81).fill(0).map(() => []);

  // const config = Sudoku.generateConfig({ normalize: true });
  for (let k = 80; k >= minK; k--) {
    const nck = nChooseK(81, k);

    // const onePercent = nck / 100n;
    for (let bigR = 0n; bigR < nck; bigR++) {
      // if ((bigR % onePercent) === 0n) {
      //   console.log(`k=${k} ${Number(bigR / onePercent)}%`);
      // }

      // TODO Ensure this function (createSieve) is working correctly, since original bitCombo was
      // TODO   replaced by bitCombo2. The two *should* have been functioning the exact same.
      const mask = bitCombo(81, k, bigR);

      // Check all sieve items starting from the end of the sieve
      let isDerivative = false;
      for (let i = 80; i > k && !isDerivative; i--) {
        for (let j = 0; j < sieve[i].length && !isDerivative; j++) {
          if ((mask & (~sieve[i][j])) === 0n) {
            isDerivative = true;
          }
        }
      }

      if (isDerivative) {
        continue;
      }

      const puzzle = Sudoku.mask(_config, mask);
      if (!puzzle.hasUniqueSolution()) {
        sieve[k].push(mask);
        debug.log(puzzle.toString());
      }
    }
  }

  return sieve;
}

// const config = Sudoku.generateConfig({ normalize: true });
// const sieve = createSieve(config, 77);

/**
 *
 * @param {Sudoku} config
 * @returns
 */
function thing(config) {
  const board = config.board2D;
  // Create a lookup table for the board such that table[row][digit] = column
  const colDigitTransform = Array(9).fill(0).map(() => Array(9).fill(0));
  // And another for the board such that table[column][digit] = row
  const rowDigitTransform = Array(9).fill(0).map(() => Array(9).fill(0));
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const digit = board[row][col];
      colDigitTransform[row][digit] = col;
      rowDigitTransform[col][digit] = row;
    }
  }
}

/**
 * Locates unsolvable pairs in a Sudoku configuration.
 * An unsolvable pair is a pair of 4 cells that, when removed, render the puzzle unsolvable.
 *
 * @param {Sudoku} config
 * @returns {bigint[]}
 */
export function findUnsolvablePairs(config) {
  debug.log(`findUnsolvablePairs(${config.toString()})`);
  const board = config.board2D;

  // Create a lookup table for the board such that table[row][digit] = column
  const colDigitTransform = Array(9).fill(0).map(() => Array(9).fill(0));
  // And another for the board such that table[column][digit] = row
  const rowDigitTransform = Array(9).fill(0).map(() => Array(9).fill(0));
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const digit = board[row][col];
      colDigitTransform[row][digit] = col;
      rowDigitTransform[col][digit] = row;
    }
  }

  const pairs = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      // Checking through the row
      for (let c = 0; c < 9; c++) {
        if (c === col) {
          continue;
        }

        // Locate the row of second digit in the column of the first
        const r = rowDigitTransform[col][board[row][c]];
        if (!isUnsolvablePair(config, row, col, r, c)) {
          continue;
        }

        const invalidPuzzleR = bitComboToR(81, 77, BigInt(`0b${'1'.repeat(81)}`) & ~(
          (1n << BigInt(80 - (row * 9 + col))) |
          (1n << BigInt(80 - (row * 9 + c))) |
          (1n << BigInt(80 - (r * 9 + col))) |
          (1n << BigInt(80 - (r * 9 + c)))
        ));

        // Ensure that the puzzle mask is not already in the list
        if (!pairs.includes(invalidPuzzleR)) {
          pairs.push(invalidPuzzleR);
          debug.log(Sudoku.mask(config, bitCombo(81, 77, invalidPuzzleR)).toString());
        }
      }

      // Checking through the column
      for (let r = 0; r < 9; r++) {
        if (r === row) {
          continue;
        }

        // Locate the column of second digit in the row of the first
        const c = colDigitTransform[row][board[r][col]];
        if (!isUnsolvablePair(config, row, col, r, c)) {
          continue;
        }

        const invalidPuzzleR = bitComboToR(81, 77, BigInt(`0b${'1'.repeat(81)}`) & ~(
          (1n << BigInt(80 - (row * 9 + col))) |
          (1n << BigInt(80 - (row * 9 + c))) |
          (1n << BigInt(80 - (r * 9 + col))) |
          (1n << BigInt(80 - (r * 9 + c)))
        ));

        // Ensure that the puzzle mask is not already in the list
        if (!pairs.includes(invalidPuzzleR)) {
          pairs.push(invalidPuzzleR);
          debug.log(`${Sudoku.mask(config, invalidPuzzleR).toString()}`);
        }
      }
    }
  }

  return pairs;
}

export function isUnsolvablePair(config, r1, c1, r2, c2) {
  const board = config.board2D;
  const d1 = board[r1][c1];
  const d2 = board[r2][c2];
  const d3 = board[r1][c2];
  const d4 = board[r2][c1];
  const region1 = cellRegion2D(r1, c1);
  const region2 = cellRegion2D(r2, c2);
  const region3 = cellRegion2D(r1, c2);
  const region4 = cellRegion2D(r2, c1);

  const result = (
    (d1 === d2) &&
    (d3 === d4) &&
    (d1 !== d3) &&
    (region1 !== region2) &&
    (region3 !== region4) &&
    (
      ((region1 === region3) && (region2 === region4)) ||
      ((region1 === region4) && (region2 === region3))
    )
  );

  return result;
}

// TODO Remove later - This is here to catch the seen caching in CPU perf
/**
 * @typedef {Object} Memo
 * @property {Set<BigInt>} seen
 * @property {(mask: BigInt) => boolean} has
 * @property {(mask: BigInt) => void} add
 */

/**
 *
 * @returns {Memo}
 */
function _memo() {
  const seen = new Set();

  return {
    seen,
    has(mask) {
      return seen.has(mask);
    },
    add(mask) {
      seen.add(mask);
    }
  };
}

/**
 * Definitions:
 *    config: A completely full and valid sudoku board.
 *    chain: A set of cells on a sudoku board
 */

/**
 * Minimum possible unsolvable chain length.
 *
 * On a Sudoku configuration, an unsolvable chain is a set of cells such that
 * the removal of any cell from the chain results in an unsolvable puzzle.
 */
const MIN_LENGTH = 4;

/**
 * The minimum number of digits to consider for an unsolvable chain.
 */
const MIN_DIGITS = 2;

/**
 *
 * @param {Sudoku} config The full Sudoku to use as the basis for the sieve.
 * @param {object} options
 * @param {number} options.maxLength The maximum length of a chain to consider.
 * @param {number} options.maxDigits The maximum number of digits to consider for a chain.
 * @param {bigint[]} options.sieve A pre-existing sieve to use for filtering out
 * invalid chains for the given config.
 * @returns {bigint[]}
 */
export function createSieve2(config, options = {
  maxLength: MIN_LENGTH,
  maxDigits: MIN_DIGITS,
  sieve: []
}) {
  const { maxLength, maxDigits, sieve } = Object.assign({
    maxLength: MIN_LENGTH,
    maxDigits: MIN_DIGITS,
    sieve: []
  }, options);

  if (maxLength < MIN_LENGTH || maxDigits < MIN_DIGITS) {
    return [];
  }

  // TODO Loop through all possible chain lengths, starting at 4
  // TODO ? Is it possible to skip all ODD chain lengths?

  // const maxStat = Math.floor(maxLength / 2);
  debug.log(`createSieve2({\n  config: ${config.toString()},\n  maxLength: ${maxLength},\n  maxDigits: ${maxDigits}\n})`);

  const configBoard = config.board;
  const board2D = config.board2D;

  // Lookup table[row][digit] = column
  /** @type {number[][]} */
  const colDigitTransform = Array(9).fill(0).map(() => Array(9).fill(0));
  // Lookup table[column][digit] = row
  /** @type {number[][]} */
  const rowDigitTransform = Array(9).fill(0).map(() => Array(9).fill(0));
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const digit = board2D[row][col];
      colDigitTransform[row][digit - 1] = col;
      rowDigitTransform[col][digit - 1] = row;
    }
  }

  const chains = [];

  let queueCount = 0;
  let seenCount = 0;
  let puzzleCheckCount = 0;
  let derivativeCount = 0;

  // TODO Remove after testing
  const test_wanted = new Set([
    '21857463957389612446912357872145938635468179298623741514796..5369531..47832745961',
    '218574639573896124469123578721459386354681792986237415.479.2853.953.8247832745961',
    '218574639573896124469123578721459386354681.9.986237415147962853695318.4.832745961',
    '2185746395738961244691235787214593863546..7929862374151479628536953..247832745961',
    '218574639573896124469123578.21459.86.54681.92986237415147962853695318247832745961',
    '218574639573896124469123578.2145.386354681792.8623.415147962853695318247832745961',
    '218574639573896124469123578.2.459386354681792986237415.4.962853695318247832745961',
    '21.57463.57389612446.12357.721459386354681792986237415147962853695318247832745961',
    '.1.574639573896124469123578721459386354681792986237415147962853695318247.3.745961'
  ].map(s => BigInt(`0b${s.replace(/[^.]/g, '0').replace(/\./g, '1')}`)));

  // const FULL_MASK = (1n << 81n) - 1n;

  /**
   * @typedef {Object} SearchSubspace
   * @property {number[]} digits
   * @property {Memo} cache
   * @property {number[][]} chains
   */

  /**
   * Search queue for finding chains. This is subdivided into smaller queues, where
   * the index is the bitcombo of digits
   * @type {SearchSubspace[]}
   */
  const queue = [
    ...range(2**9).map(r => {
      const digits = bitComboToDigits(9, BigInt(r)).map(d => d + 1);

      if (digits.length < 2 || digits.length > maxDigits) {
        return null;
      }

      return {
        digits,
        cache: _memo(),
        chains: configBoard.reduce((_chains, digit, ci) => {
          if (digits.includes(digit)) {
            _chains.push([ci]);
          }
          return _chains;
        }, [])
      };
    })
  ];

  const solvesUniquelyCache = {
    _yes: new Set(),
    _no: new Set(),

    _yesHits: 0,
    _noHits: 0,
    _misses: 0,

    _totalYesHits: 0,
    _totalNoHits: 0,
    _totalMisses: 0,

    /**
     *
     * @param {Sudoku} puzzle
     * @returns {boolean}
     */
    solvesUniquely: function(puzzle) {
      const key = puzzle.toString();
      if (this._yes.has(key)) {
        this._yesHits++;
        return true;
      } else if (this._no.has(key)) {
        this._noHits++;
        return false;
      }

      this._misses++;
      const result = puzzle.hasUniqueSolution();
      if (result) {
        this._yes.add(key);
      } else {
        this._no.add(key);
      }

      return result;
    },

    getStats: function() {
      return {
        yes: this._yes.size,
        no: this._no.size,
        yesHits: this._yesHits,
        noHits: this._noHits,
        misses: this._misses,
        totalYesHits: this._totalYesHits + this._yesHits,
        totalNoHits: this._totalNoHits + this._noHits,
        totalMisses: this._totalMisses + this._misses
      };
    },

    rollStats: function() {
      this._totalYesHits += this._yesHits;
      this._totalNoHits += this._noHits;
      this._totalMisses += this._misses;
      this._yesHits = 0;
      this._noHits = 0;
      this._misses = 0;
    }
  }

  // const isQueueEmpty = () => queue.every(subspace => subspace.chains.length === 0);

  // For each number of digits (k in [2, maxDigits]) and each bitcombo in 9 choose k,
  //    work through the search subspace to find all sieve chains.
  for (let k = 2; k <= maxDigits; k++) {
    const nck = nChooseK(9, k);
    // For each bitcombo of 9 choose k
    for (let bigR = 0n; bigR < nck; bigR++) {
      const subspaceIndex = bitCombo(9, k, bigR);
      // /** @type {SearchSubspace} */
      // const subspace = queue[subspaceIndex];
      // if (!subspace) {
      //   debug.log(`  - Skipping subspace ${subspaceIndex}`);
      //   continue;
      // }
      // const subqueue = subspace.chains;

      const digits = bitComboToDigits(9, BigInt(subspaceIndex)).map(d => d + 1);

      if (digits.length < 2 || digits.length > maxDigits) {
        continue;
      }

      // const seenIndices = Array(81).fill(false);

      for (let ci = 0; ci < configBoard.length; ci++) {
        // seenIndices[ci] = true;
        if (!digits.includes(configBoard[ci])) {
          continue;
        }

        // TODO is there a good way to use a cache here? (somewhere around here...)

        const subqueue = [[ci]];
        // TODO debug log the subspace digits and stuff
        // TODO keep track of search stats for each subspace and print them out at the end
        debug.log(`  - Searching subspace @index [${ci}]: digits ${digits}`);
        // debug.log(`  - Searching subspace[${subspaceIndex}]: digits ${subspace.digits}`);

        const startTime = Date.now();
        queueCount = 0;
        derivativeCount = 0;
        puzzleCheckCount = 0;
        let singleDigitFailCount = 0;
        let distinctDigitFailCount = 0;
        let mathFailCount = 0;
        let uniqueSolutionCount = 0;
        let antiderivativeFailCount = 0;
        let deadendCount = 0;
        let chainLengthMaxedCount = 0;

        let lastUpdate = startTime;
        let numUpdates = 0;
        const UPDATE_INTERVAL_MS = 1000*15;

        while (subqueue.length > 0) {
          const now = Date.now();
          const timeSinceLastUpdate = now - lastUpdate;
          if (timeSinceLastUpdate > UPDATE_INTERVAL_MS) {
            numUpdates++;
            lastUpdate = now;
            debug.log(`#   { time: ${now - startTime}ms,` +
              ` queued: ${queueCount},` +
              ` derivatives: ${derivativeCount},` +
              ` singleDigitFilter: ${singleDigitFailCount},` +
              ` distinctDigitFilter: ${distinctDigitFailCount},` +
              ` mathFilter: ${mathFailCount},` +
              ` puzzlesChecked: ${puzzleCheckCount},` +
              ` uniqueSol: ${uniqueSolutionCount},` +
              ` antiderivFail: ${antiderivativeFailCount},` +
              ` deadend: ${deadendCount},` +
              ` chainMaxed: ${chainLengthMaxedCount} }`
            );
            debug.log(`  =>{ solvesUniquelyCache: ${JSON.stringify(solvesUniquelyCache.getStats())} }`);
          }

          const chain = subqueue.shift();
          queueCount++;
          const chainRoot = chain[0];
          const last = chain[chain.length - 1];
          const chainMask = chain.reduce((mask, chainCI) => mask | (1n << BigInt(80 - chainCI)), 0n);

          // ! Testing jumpoff: Looking for specific chains to debug.
          // if (test_wanted.has(chainMask)) {
          //   debug.log(`! ${chainMask.toString(2).padStart(81, '0')}`);
          //   test_wanted.delete(chainMask);
          // }

          // TODO If worth the mem + time, keep track of seen chains by Set<bigint> of chainMasks.
          // TODO Skip if the chain has been seen before.
          // TODO Determine if it is better to check seen chains before or after checking if derivative.

          // Skip if the chain is a derivative of a previous chain
          const sieveItem = (
            sieve.find(_sieveItem => (_sieveItem & chainMask) === _sieveItem) ||
            chains.find(_chain => (_chain & chainMask) === _chain)
          );
          if (sieveItem) {
            // debug.log('  ❌ is derivative:');
            // debug.log(`  ${sieveItem.toString(2).padStart(81, '0')}`);
            // debug.log(`- ${chainMask.toString(2).padStart(81, '0')}`);
            derivativeCount++;
            continue;
          }

          // debug.log(`  ${config.filterIndices(chain).toString()}`);

          // TODO If the chain length >= minimum target length (2 * k),
          // TODO   AND the first and last cells are row or column peers,
          // TODO   THEN check if the chain is irreducible, NOT uniquely solvable, and all antiderivatives are uniquely solvable.
          if (chain.length >= 2*k && isRowOrColPeer(chainRoot, last)) {
            // debug.log(chainPuzzle.toFullString());
            let passing = true;

            // const chainPuzzle = config.keepIndices(chain);
            // const chainBoard = config.board.map((digit, ci) => (chain.includes(ci) ? 0 : digit));
            const stats = analyzeEmptyCellChain(configBoard, chain);
            const m = stats.emptyCells.length;
            const numRows = stats.rows.length;
            const numCols = stats.cols.length;
            const numRegions = stats.regions.length;
            const distinctDigits = stats.distinctDigits;
            const noSingleDigits = stats.digitCounts.every((count) => (count === 0 || count > 1));

            if (!noSingleDigits) {
              // debug.log('  ❌ not all digits have complements');
              passing = false;
              singleDigitFailCount++;
            }

            if (distinctDigits !== k) {
              // debug.log('  ❌ distinct digits !== k');
              passing = false;
              distinctDigitFailCount++;
            }

            // Debug If chainBoard looks like this:
            // '.1.574639573896124469123578721459386354681792986237415147962853695318247.3.745961'
            // 1511157274518286468383040n (associated chainMask for future ref)
            // if (chainBoard.join('').replace(/0/g, '.') === '2.8.74.395738961244.9.23.78721459386354681792986237415147962853695318247832745961') {
            //   debug.log(`> ${chainBoard.join('').replace(/0/g, '.')}`);
            // }

            // Check common properties of unsolvable chains
            if (
              passing && (
                // numRows, numCols, and numRegions must be at least 2
                numRows < 2 || numRows === m ||
                numCols < 2 || numCols === m ||
                numRegions < 2 || numRegions === m ||

                // numRows * numCols must be at least m
                // TODO Can this be proven mathematically?
                numRows * numCols < m ||

                // numDigits must be at most m / 2
                distinctDigits > m / 2 ||

                // When rows or cols or regions are 2,
                ((numRows === 2 || numCols === 2 || numRegions === 2) && (
                  // rows * cols must equal m
                  numRows * numCols !== m ||

                  // numDigits must be m / 2
                  distinctDigits !== m / 2
                ))
              )
            ) {
              // debug.log('  ❌ not a chain');
              passing = false;
              mathFailCount++;
            }

            // TODO Find a better way to test for irreducibility than actually solving, if possible
            if (passing) {
              const puzzle = config.filterOutIndices(chain);
              puzzleCheckCount++;
              if (solvesUniquelyCache.solvesUniquely(puzzle)) {
              // if (puzzle.hasUniqueSolution()) {
                // debug.log('  ❌ has unique solution');
                uniqueSolutionCount++;
              } else {
                // debug.log('  ❌ some antiderivatives have zero or multiple solutions');
                const antiderivatives = antiderivativePuzzles(puzzle);
                // antiderivatives.some((p) => !p.hasUniqueSolution())
                let allGucci = true;
                for (let i = 0; i < antiderivatives.length; i++) {
                  puzzleCheckCount++;
                  if (!solvesUniquelyCache.solvesUniquely(antiderivatives[i])) {
                  // if (!antiderivatives[i].hasUniqueSolution()) {
                    allGucci = false;
                    antiderivativeFailCount++;
                    break;
                  }
                }

                if (allGucci) {
                  // debug.log('  ✅ All antiderivatives have unique solutions.');
                  debug.log(`${chains.length}  ✅ ${config.filterOutIndices(chain).toString()}`);
                  // debug.log(new Sudoku(chainBoard).toFullString() + '\n');
                  chains.push(chainMask);
                  sieve.push(chainMask);

                  continue;

                  // Remove all search space items that are derivatives of this chain
                  // const beforeRemovalLength = queue.length;
                  // subspace.chains = subqueue.filter((_chain) => {
                  //   const _chainMask = _chain.reduce((mask, chainCI) => mask | (1n << BigInt(80 - chainCI)), 0n);
                  //   return ((chainMask & _chainMask) !== _chain);
                  // });
                  // debug.log(`  - removed ${beforeRemovalLength - queue.length} derivative chains`);
                }
              }
            }
          }

          if (
            chain.length >= maxLength
            // numRows > maxStat ||
            // numCols > maxStat ||
            // numRegions > maxStat
          ) {
            chainLengthMaxedCount++;
            continue;
          }

          // ! Dead end check
          // Quick dead-end check: all the first cell's available row and column neighbors are inaccessible.
          const rootRow = cellRow(chainRoot);
          const rootCol = cellCol(chainRoot);
          // Count the number of root's neighbors that are NOT in the chain.
          // const rootNeighborsAvailable = subspace.digits.reduce((acc, d) => {
          const rootNeighborsAvailable = digits.reduce((acc, d) => {
            // If the digit is the root's digit, skip it
            if (d === configBoard[chainRoot]) {
              return acc;
            }

            const rowNeighbor = 9*rootRow + colDigitTransform[rootRow][d - 1];
            if (!chain.includes(rowNeighbor)) {
              acc++;
            }

            const colNeighbor = 9*rowDigitTransform[rootCol][d - 1] + rootCol;
            if (!chain.includes(colNeighbor)) {
              acc++;
            }

            return acc;
          }, 0);

          // If the root has no available neighbor to complete the chain, then the chain is a dead end
          if (rootNeighborsAvailable === 0) {
            // debug.log('  ❌ no root neighbors available');
            deadendCount++;
            continue;
          }
          // ! (end) Dead end check

          // ! Dead end check 2
          // Find the shortest path (BFS) between the root and the last cell.
          // If there is no path, then the chain is a dead end.
          /** @type {number[]} */
          // const remainingCells = configBoard.reduce((acc, d, _ci) => {
          //   if (digits.includes(d) && !chain.includes(_ci) && _ci > ci) {
          //     acc.push(_ci);
          //   }
          //   return acc;
          // }, []);
          // remainingCells.push(last);

          // const pathsQueue = [[chainRoot]];
          // let path = null;
          // let pathFound = false;
          // while (pathsQueue.length > 0) {
          //   path = pathsQueue.shift();
          //   const lastPathCell = path[path.length - 1];
          //   if (lastPathCell === last) {
          //     pathFound = true;
          //     break;
          //   }

          //   const lastPathRow = cellRow(lastPathCell);
          //   const lastPathCol = cellCol(lastPathCell);
          //   // const lastPathRegion = cellRegion(lastPathCell);

          //   digits.forEach((d) => {
          //     // Add the ROW neighbor(s) if not already part of the chain
          //     const rowNeighbor = 9*lastPathRow + colDigitTransform[lastPathRow][d - 1];
          //     if (!path.includes(rowNeighbor) && remainingCells.includes(rowNeighbor)) {
          //       pathsQueue.push([...path, rowNeighbor]);
          //     }

          //     // Add the COL neighbors
          //     const colNeighbor = 9*rowDigitTransform[lastPathCol][d - 1] + lastPathCol;
          //     if (!path.includes(colNeighbor) && remainingCells.includes(colNeighbor)) {
          //       pathsQueue.push([...path, colNeighbor]);
          //     }
          //   });
          // }

          // if (!pathFound) {
          //   // debug.log('  ❌ no path found');
          //   deadendCount++;
          //   continue;
          // }
          // ! (end) Dead end check 2

          // Expand the chain for all available row and column neighbors.
          // const firstDigit = configBoard[first];
          // const firstRow = cellRow(first);
          // const firstCol = cellCol(first);
          // const lastDigit = configBoard[last];
          const lastRow = cellRow(last);
          const lastCol = cellCol(last);
          const subqueueLengthBeforeExpanding = subqueue.length;
          // subspace.digits.forEach((d) => {
          digits.forEach((d) => {
            // Add the ROW neighbor(s) if not already part of the chain
            const rowNeighbor = 9*lastRow + colDigitTransform[lastRow][d - 1];
            if (!chain.includes(rowNeighbor) && rowNeighbor > ci) {
              subqueue.push([...chain, rowNeighbor]);
            }

            // Add the COL neighbors
            const colNeighbor = 9*rowDigitTransform[lastCol][d - 1] + lastCol;
            if (!chain.includes(colNeighbor) && colNeighbor > ci) {
              subqueue.push([...chain, colNeighbor]);
            }
          });

          // debug.log(`  + expanded queue by ${subqueue.length - subqueueLengthBeforeExpanding}`);
        } // end subqueue search

        const timed = Date.now() - startTime;
        debug.log(`  =>{ time: ${timed}ms,` +
          ` queued: ${queueCount},` +
          ` derivatives: ${derivativeCount},` +
          ` singleDigitFilter: ${singleDigitFailCount},` +
          ` distinctDigitFilter: ${distinctDigitFailCount},` +
          ` mathFilter: ${mathFailCount},` +
          ` puzzlesChecked: ${puzzleCheckCount},` +
          ` uniqueSol: ${uniqueSolutionCount},` +
          ` antiderivFail: ${antiderivativeFailCount},` +
          ` deadend: ${deadendCount},` +
          ` chainMaxed: ${chainLengthMaxedCount} }`
        );
        debug.log(`  =>{ solvesUniquelyCache: ${JSON.stringify(solvesUniquelyCache.getStats())} }`);
        solvesUniquelyCache.rollStats();
      }

    }
  }

  // debug.log(`Queue items searched: ${queueCount}`);
  // debug.log(`Seen size: ${cache.seen.size}`);
  // debug.log(`Seen hits: ${seenCount}`);
  // debug.log(`Puzzle check count: ${puzzleCheckCount}`);
  // debug.log(`Derivative count: ${derivativeCount}`);
  return chains;
}

/**
 *
 * @param {Sudoku} config
 * @param {number[]} chain
 * @returns {boolean}
 */
export function isIrreducableChain(config, chain) {
  const puzzle = Sudoku.mask(config, mask);

  const stats = analyzeEmptyCellChain(puzzle);
  const m = stats.emptyCells.length;
  const numRows = stats.rows.length;
  const numCols = stats.cols.length;
  const numRegions = stats.regions.length;
  const numDigits = stats.digits.length;
}

/**
 *
 * @param {number[]} configBoard
 * @param {number[]} chain
 */
export function analyzeEmptyCellChain(configBoard, chain) {
  const result = {
    rows: [],
    cols: [],
    regions: [],
    distinctDigits: 0,
    digitCounts: Array(9).fill(0), // TODO Should this index by the actual digit, not the digit - 1? Which is more intuitive?
    emptyCells: [] // TODO Why is this here? Can it be removed?
  };

  for (let chainIndex = 0; chainIndex < chain.length; chainIndex++) {
    const ci = chain[chainIndex];
    const row = cellRow(ci);
    const col = cellCol(ci);
    const region = cellRegion(ci);
    const digit = configBoard[ci];

    if (!result.rows.includes(row)) {
      result.rows.push(row);
    }

    if (!result.cols.includes(col)) {
      result.cols.push(col);
    }

    if (!result.regions.includes(region)) {
      result.regions.push(region);
    }

    if (result.digitCounts[digit - 1] === 0) {
      result.distinctDigits++;
    }
    result.digitCounts[digit - 1]++;

    if (!result.emptyCells.includes(ci)) {
      result.emptyCells.push(ci);
    }
  }

  return result;
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
 * @param {Sudoku} puzzle
 * @returns {Sudoku[]}
 */
function antiderivativePuzzles(puzzle) {
  // TODO this might be a PITA to debug
  const _puzzle = new Sudoku(puzzle);
  _puzzle._resetEmptyCells();
  _puzzle._reduce();
  return _puzzle.board.reduce((acc, digit, ci) => {
    if (digit === 0) {
      _puzzle.getCandidates(ci).forEach((candidate) => {
        const newPuzzle = new Sudoku(puzzle);
        newPuzzle.setDigit(candidate, ci);
        acc.push(newPuzzle);
      });
    }

    return acc;
  }, []);
}

/**
 *
 * @param {number} n
 * @param {bigint} bigR
 * @returns {number[]}
 */
function bitComboToDigits(n, bigR) {
  const digits = [];
  for (let i = 0; i < n; i++) {
    if (bigR & (1n << BigInt(i))) {
      digits.push(i);
    }
  }
  return digits;
}

function isRowPeer(ci1, ci2) {
  return cellRow(ci1) === cellRow(ci2);
}

function isColPeer(ci1, ci2) {
  return cellCol(ci1) === cellCol(ci2);
}

function isRowOrColPeer(ci1, ci2) {
  return isRowPeer(ci1, ci2) || isColPeer(ci1, ci2);
}

// const config = new Sudoku('218574639573896124469123578721459386354681792986237415147962853695318247832745961');
// const normalConfig = new Sudoku(config.normalizedBoard);

// // console.log(analyzeEmptyCellChain(config.board, [1, 3, 6, 19, 21, 24]));
// console.log(`Building sieve...`);
// const _maxDig = 3;
// const _maxLen = _maxDig * 2;
// const startTime = Date.now();
// const sieve = createSieve2(config, {
//   maxLength: 2*9,
//   maxDigits: 2
// });
// createSieve2(config, {
//   maxLength: 9,
//   maxDigits: 3,
//   sieve
// });
// createSieve2(config, {
//   maxLength: 8,
//   maxDigits: 4,
//   sieve
// });
// const endTime = Date.now();
// sieve.forEach((mask) => {
//   console.log(normalConfig.filter(mask).toString());

//   // console.log('\n' + normalConfig.filter(~mask).toString());
//   // console.log(normalConfig.filter(mask).toFullString());
// });
// console.log(`\nSieve built. ${sieve.length} chains found in ${endTime - startTime} ms.`);
// console.log(`  ${normalConfig.toString()}`);
