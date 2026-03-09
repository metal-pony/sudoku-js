import arg from 'arg';
import Sudoku, { SearchState } from '../../src/sudoku/Sudoku.js';

const args = arg({
  '--puzzle': String,
  '-p': '--puzzle',

  '--first': Boolean,
  '-f': '--first',

  '--verbose': Boolean,
  '-v': '--verbose',
  '--v': '--verbose',
});

const rawPuzzle = args['--puzzle'] || args['_'][0];
const puzzle = rawPuzzle ? new Sudoku(rawPuzzle.trim().slice(0, 81)) : null;
if (!puzzle) {
  console.log('No puzzle provided');
  process.exit(1);
}
const firstOnly = Boolean(args['--first']);
const verbose = Boolean(args['--verbose']);

if (verbose) {
  console.log(`Solving ${puzzle.toString()}`);
}

if (firstOnly) {
  console.log(puzzle.solution().toString());
} else {
  const start = Date.now();
  const search = new SearchState(puzzle);
  while (search.advanceToSolution()) {
    console.log(search.solution.toString());
  }
  const end = Date.now();
  if (verbose) {
    console.log(`Found ${search.numSolutions} solutions in ${end - start} ms.`);
  }
}
