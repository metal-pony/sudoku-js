import arg from 'arg';
import Sudoku, { MIN_CLUES } from '../../src/sudoku/Sudoku.js';
import { seedSieve } from '../../src/sudoku/SudokuSieve.js';

const args = arg({
  '--solution': String,
  '--amount': Number,
  '--clues': Number,
  '--normalize': Boolean,
  '--timeLimit': Number,
  '--sieveLevel': Number,
  '--difficulty': Number,

  '-s': '--solution',
  '--grid': '--solution',
  '-a': '--amount',
  '-c': '--clues',
  '-n': '--normalize',
  '-t': '--timeLimit',
  '-lv': '--sieveLevel',
  '-d': '--difficulty',
  '--diff': '--difficulty'
});

const DEFAULT_AMOUNT = 1;
const DEFAULT_NUM_CLUES = 33;
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
// Ignore negative timeout
const timeoutMs = Math.max(0, Math.trunc(Number(args['--timeLimit']) || DEFAULT_TIME_LIMIT_MS));
const normalize = Boolean(args['--normalize']);
const sieveLevel = Math.trunc(Number(args['--sieveLevel']) || DEFAULT_SIEVE_LEVEL);
if (sieveLevel < 0 || sieveLevel === 1 || sieveLevel > 4) {
  throw new Error(`Invalid sieveLevel ${sieveLevel}; expected 2 - 4.`);
}
const targetDifficulty = Math.trunc(Number(args['--difficulty']) || 1);

let sieve = [];
if (providedSolution) {
  if (normalize) providedSolution.normalize();
  seedSieve({ grid: providedSolution, sieve, level: sieveLevel });
}

let count = 0;
while (count < amount) {
  const grid = providedSolution || Sudoku.generateConfig({ normalize });
  sieve = providedSolution ? sieve : seedSieve({ grid, sieve: [], level: sieveLevel });
  const puzzle = Sudoku.generatePuzzle2({ grid, numClues, sieve, difficulty: targetDifficulty, timeoutMs });
  if (puzzle) {
    console.log(puzzle.toString());
    count++;
  } else {
    console.warn('🚨 Time limit exceeded.');
    process.exit(1);
  }
}
