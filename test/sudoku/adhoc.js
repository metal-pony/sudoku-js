import {
  Debugger,
  Sudoku,
  SudokuSieve,
  bitCombo,
  cellMask,
  digitMask,
  nChooseK,
  sieveCombos4
} from '../../index.js';
import {
  NUM_DIGITS,
  NUM_SPACES
} from '../../src/sudoku/Sudoku.js';

const debug = new Debugger(true);

/**
 *
 * @param {number} k
 * @param {(digitCombo: number) => void} cb
 */
function forEachDigitCombo(k, cb) {
  const nck = nChooseK(NUM_DIGITS, k);
  for (let r = 0n; r < nck; r++) {
    cb(Number(bitCombo(NUM_DIGITS, k, r)));
  }
}

// const generationResults = Sudoku.generate({ normalize: true });
/** @type {Sudoku} */
const config = new Sudoku('218574639573896124469123578721459386354681792986237415147962853695318247832745961');
// const config = generationResults[0].solutions[0];
const configBoard = config.board;
const ss = new SudokuSieve({ config });

// Populates the sieve with all possible UAs made with combinations of k digits
const k = 2;
forEachDigitCombo(k, (dCombo) => {
  ss.addFromMask(~configBoard.reduce((pMask, d, ci) => (
    (digitMask(d) & dCombo) ? (pMask |= cellMask(ci)) : pMask
  ), 0n));
});

// const sieve = ss.items;
const maxComboLength = 17;
const maxResultSet = 1_000_000;
debug.log(`Generating combos sieveCombos4(maxLen: ${maxComboLength}) from sieve (length: ${ss.length})...`);
const start = Date.now();
const results = sieveCombos4(ss, maxComboLength, maxResultSet);
debug.log(`Done in ${(Date.now() - start)}ms`);
debug.log(`config: ${config.toString()}`);

// Verify results: All items should cover the sieve entirely.
let allCovered = true;
results.forEach((masks, numClues) => {
  if (masks.size === 0) {
    return;
  }

  debug.log(`Verifying ${masks.size} results (numClues: ${numClues})...`);
  const _masks = Array.from(masks);
  _masks.forEach((mask) => {
    // if (sieve.some(item => (item & mask) === 0n)) {
    if (!ss.doesMaskSatisfy(mask)) {
      allCovered = false;
      debug.log(`\n❌ ${mask.toString(2).padStart(81, '0').replace(/0/g, '.').replace(/1/g, '#')}  ${numClues}`);
    }
  });
});
if (allCovered) {
  debug.log('✅ sieveCombos4() results verified.');
}

// Reading sieve combos from maxLength to the min generated,
//    if the combo mask is a valid puzzle (solutionsFlag === 1),
//    then print it
for (let numClues = results.length - 1; numClues > 0; numClues--) {
  const masks = Array.from(results[numClues]);
  if (masks.length > 0) {
    masks.forEach((mask, i) => {
      const p = config.filter(mask);
      let start = Date.now();
      const flag = p.solutionsFlag();
      const flagTime = Date.now() - start;
      debug.log(`[${numClues}] ${p.toString()}  [flag: ${flag}] ${flagTime}ms`);

      if (flag === 1) {
        debug.log(`[${numClues}] ⭐️ ${p.toString()}`);
      }
    });
  }
}
