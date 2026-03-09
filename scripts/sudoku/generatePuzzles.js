import arg from 'arg';
import Sudoku, { MIN_CLUES } from '../../src/sudoku/Sudoku.js';
import { seedSieveDc } from '../../src/sudoku/SudokuSieve.js';

const args = arg({
  '--solution': String,
  '--amount': Number,
  '--clues': Number,
  '--normalize': Boolean,
  '--timeLimit': Number,
  '--sieveLevel': Number,
  '--difficulty': Number,
  '--json': Boolean,
  '--fingerprint': Number,

  '-s': '--solution',
  '--grid': '--solution',
  '-a': '--amount',
  '-c': '--clues',
  '-n': '--normalize',
  '-t': '--timeLimit',
  '-lv': '--sieveLevel',
  '-d': '--difficulty',
  '--diff': '--difficulty',
  '-j': '--json',
  '-f': '--fingerprint'
});

const DEFAULT_AMOUNT = 1;
const DEFAULT_NUM_CLUES = 32;
const DEFAULT_TIME_LIMIT_MS = 60*1000; // 1 Minute
const DEFAULT_SIEVE_LEVEL = 0; // Valid levels: 0 (omit), 2, 3, 4. There is no '1', is that weird?

const rawSolution = args['--solution'];
const providedSolution = rawSolution ? new Sudoku(rawSolution.trim().slice(0, 81)) : null;
const amount = Math.trunc(Number(args['--amount']) || DEFAULT_AMOUNT);
if (amount < 1) {
  throw new Error(`Invalid amount ${amount}; expected 1 - any`);
}
const numClues = Math.trunc(Number(args['--clues']) || DEFAULT_NUM_CLUES);
if (numClues < MIN_CLUES || numClues > 81) {
  throw new Error(`Invalid number of clues ${numClues}; expected 17 - 81`);
}
let timeoutMs = Math.trunc(Number(args['--timeLimit']));
// Ignore negative timeout
if (timeoutMs === undefined || timeoutMs === null || timeoutMs < 0) {
  timeoutMs = DEFAULT_TIME_LIMIT_MS;
}
const normalize = Boolean(args['--normalize']);
const sieveLevel = Math.trunc(Number(args['--sieveLevel']) || DEFAULT_SIEVE_LEVEL);
if (sieveLevel < 0 || sieveLevel === 1 || sieveLevel > 4) {
  throw new Error(`Invalid sieveLevel ${sieveLevel}; expected 2 - 4.`);
}
const targetDifficulty = Math.trunc(Number(args['--difficulty']) || 1);
const json = Boolean(args['--json']);
const fpLevel = Math.trunc(Number(args['--fingerprint']) || 0);

let sieve = [];
let fp2 = undefined;
let fp3 = undefined;
let fp4 = undefined;
if (providedSolution) {
  if (normalize) providedSolution.normalize();
  if (sieveLevel >= 2) seedSieveDc({ grid: providedSolution, sieve, level: sieveLevel });
  if (fpLevel >= 2) fp2 = providedSolution.dc2();
  if (fpLevel >= 3) fp3 = providedSolution.dc3();
  if (fpLevel >= 4) fp4 = providedSolution.dc4();
}

let count = 0;
if (json && amount > 1) console.log('[');
while (count < amount) {
  const grid = providedSolution || Sudoku.generateConfig();
  if (normalize) grid.normalize();
  if (!providedSolution && sieveLevel >= 2) {
    sieve = seedSieveDc({ grid, sieve: [], level: sieveLevel });
  }
  const puzzle = Sudoku.generatePuzzle2({
    grid,
    numClues,
    sieve,
    difficulty: targetDifficulty,
    timeoutMs
  });
  if (puzzle) {
    if (json) {
      if (fpLevel >= 2 && !providedSolution) fp2 = grid.dc2();
      if (fpLevel >= 3 && !providedSolution) fp3 = grid.dc3();
      if (fpLevel >= 4 && !providedSolution) fp4 = grid.dc4();

      console.log(JSON.stringify({
        puzzle: puzzle.toString(),
        solution: grid.toString(),
        numClues: 81 - puzzle.numEmptyCells,
        // difficulty: puzzle.difficulty(),
        fingerprint2: fp2,
        fingerprint3: fp3,
        fingerprint4: fp4
      }, null, '  ') + ((amount > 1 && count < (amount - 1)) ? ',' : ''));
    } else {
      console.log(puzzle.toString());
    }

    count++;
  } else {
    console.warn('🚨 Time limit exceeded.');
    process.exit(1);
  }
}
if (json && amount > 1) console.log(']');
