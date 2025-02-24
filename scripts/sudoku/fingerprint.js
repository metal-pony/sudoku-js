import arg from 'arg';
import Sudoku from '../../src/sudoku/Sudoku.js';

const args = arg({
  '--grid': String,
  '--level': Number,

  '--puzzle': '--grid',
  '--solution': '--grid',
  '-g': '--grid',
  '-p': '--grid',
  '-s': '--grid',
  '-l': '--level',
});

const DEFAULT_LEVEL = 2;

const rawGrid = args['--grid'] || args['_'][0];
const grid = rawGrid ? new Sudoku(rawGrid.trim().slice(0, 81)) : null;
if (!grid) throw new Error('No grid provided');
const level = Math.trunc(Number(args['--level']) || DEFAULT_LEVEL);
if (level < 2 || level > 4) throw new Error(`Invalid level; expected 2 <= level <= 4`);

console.log(grid.fingerprint_d(level));
