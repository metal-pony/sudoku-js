import arg from 'arg';
import Sudoku from '../../src/sudoku/Sudoku.js';
import { seedSieve } from '../../src/sudoku/SudokuSieve.js';

const args = arg({
  '--grid': String,
  '--level': Number,
  '--numbers': Boolean,

  '--puzzle': '--grid',
  '--solution': '--grid',
  '-g': '--grid',
  '-p': '--grid',
  '-s': '--grid',
  '-l': '--level',
  '-n': '--numbers'
});

const DEFAULT_LEVEL = 2;

const rawGrid = args['--grid'] || args['_'][0];
const grid = rawGrid ? new Sudoku(rawGrid.trim().slice(0, 81)) : null;
if (!grid) throw new Error('No grid provided');
const level = Math.trunc(Number(args['--level']) || DEFAULT_LEVEL);
if (level < 2 || level > 4) throw new Error(`Invalid level; expected 2 <= level <= 4`);
const asNumbers = Boolean(args['--numbers']);

const sieve = seedSieve({ grid, sieve: [], level });

if (asNumbers) {
  console.log(JSON.stringify(sieve.map(item => item.toString())));
} else {
  console.log(JSON.stringify(sieve.map(item => grid.filter(item).toString()), null, '  '));
}
