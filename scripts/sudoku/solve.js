import arg from 'arg';
import Sudoku from '../../src/sudoku/Sudoku.js';

const args = arg({
  '--puzzle': String,
  '--first': Boolean,
  '-p': '--puzzle',
  '-f': '--first'
});

const rawPuzzle = args['--puzzle'] || args['_'][0];
const puzzle = rawPuzzle ? new Sudoku(rawPuzzle.trim().slice(0, 81)) : null;
if (!puzzle) throw new Error('No puzzle provided');
const firstOnly = Boolean(args['--first']);

if (firstOnly) {
  console.log(puzzle.firstSolution().toString());
} else {
  puzzle.searchForSolutions2({
    solutionFoundCallback: solution => {
      console.log(solution.toString());
      return true;
    }
  });
}
