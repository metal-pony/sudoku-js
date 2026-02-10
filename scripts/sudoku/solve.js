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
if (!puzzle) throw new Error('No puzzle provided');
const firstOnly = Boolean(args['--first']);
const verbose = Boolean(args['--verbose']);

console.log(puzzle.toString());
console.log('Solution search...\n');

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
    console.log(`Found ${search.numSolutions} solutions; ${end - start} ms.`);
  }
}
