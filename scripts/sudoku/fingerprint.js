import arg from 'arg';
import Sudoku from '../../src/sudoku/Sudoku.js';

const args = arg({
  '--grid': String,
  '--puzzle': '--grid',
  '--solution': '--grid',
  '-g': '--grid',
  '-p': '--grid',
  '-s': '--grid',

  '--level': Number,
  '-l': '--level',

  '--verbose': Boolean,
  '-v': '--verbose',
  '--v': '--verbose',
});

const DEFAULT_LEVEL = 2;
const verbose = Boolean(args['--verbose']);
const rawGrid = args['--grid'] || args['_'][0];
const grid = rawGrid ? new Sudoku(rawGrid.trim().slice(0, 81)) : null;
if (!grid) throw new Error('No grid provided');
const level = Math.trunc(Number(args['--level']) || DEFAULT_LEVEL);
if (level < 2 || level > 4) throw new Error(`Invalid level; expected 2 <= level <= 4`);

const start = Date.now();
let fp;
switch (level) {
  case 2: fp = grid.dc2(); break;
  case 3: fp = grid.dc3(); break;
  case 4: fp = grid.dc4(); break;
}
console.log(fp);
const end = Date.now();
if (verbose) {
  console.log(`Fingerprinted in ${end - start} ms.`);
}
