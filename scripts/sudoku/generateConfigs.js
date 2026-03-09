import arg from 'arg';
import Sudoku, { SearchState } from '../../src/sudoku/Sudoku.js';

const args = arg({
  '--amount': Number,
  '-a': '--amount',

  '--normalize': Boolean,
  '-n': '--normalize',

  '--verbose': Boolean,
  '-v': '--verbose',
  '--v': '--verbose',
});

const amount = Math.trunc(Number(args['--amount']) || 1);
const normalize = Boolean(args['--normalize']);
const verbose = Boolean(args['--verbose']);

const startTime = Date.now();
const searchState = new SearchState();
const config = new Sudoku();
for (let n = 0; n < amount; n++) {
  config.genConfig(searchState);
  if (normalize) config.normalize();
  console.log(config.toString());
}
const endTime = Date.now();
if (verbose) {
  console.log(`Generated ${amount} sudoku configs in ${endTime - startTime} ms.`);
}
