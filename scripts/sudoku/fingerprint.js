import arg from 'arg';
import Sudoku from '../../src/sudoku/Sudoku.js';

const args = arg({
  '--grid': String,
  '-g': '--grid',

  '--level': Number,
  '-l': '--level',

  '--verbose': Boolean,
  '-v': '--verbose',
  '--v': '--verbose',
});

const DEFAULT_LEVEL = 2;
const verbose = Boolean(args['--verbose']);
const rawGrid = args['--grid'] || args['_'][0];
let grid = null;
try {
  grid = rawGrid ? new Sudoku(rawGrid.trim().slice(0, 81)) : null;
} catch (err) {
  console.log('Failed to parse grid (is it proper length?)');
  process.exit();
}
if (!grid) {
  console.log('No grid provided');
  process.exit();
}
if (!grid.isValid() || !grid.isSolved()) {
  console.log('Provided grid is invalid or not solved');
  process.exit();
}
const level = Math.trunc(Number(args['--level']) || DEFAULT_LEVEL);
if (level < 2 || level > 4) {
  consolee.log(`Invalid level; expected 2 <= level <= 4`);
  process.exit();
}

if (verbose) {
  console.log(`Generating fingerprint (level ${level}) for grid`);
  console.log(grid.toString());
}

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
  console.log(`Done (${end - start} ms)`);
}
