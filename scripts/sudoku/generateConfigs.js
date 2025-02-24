import arg from 'arg';
import Sudoku from '../../src/sudoku/Sudoku.js';

const args = arg({
  '--amount': Number,
  '--normalize': Boolean,

  '-a': '--amount',
  '-n': '--normalize'
});

const amount = Math.trunc(Number(args['--amount']) || 1);
const normalize = Boolean(args['--normalize']);

for (let n = 0; n < amount; n++) {
  const grid = Sudoku.generateConfig({ normalize });
  console.log(grid.toString());
}
