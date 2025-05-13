import { randomCombo } from '@metal-pony/counting-js';
import { Sudoku } from '../../index.js';
import puzzles from './puzzles24.js';
import { range, shuffle } from '../../src/util/arrays.js';


const invalidPuzzles = [
  // Invalid because of digit clashing (col 7: 3...5.3.1)
  '1.2....3..9..1.........3..1.15...4...2.1...5.8.....1.6..1....3......1...2......1.',

  // Invalid because cell 0 has no candidates
  '.123456789...1...........1.1...........1...........1....1...........1...........1'
];

describe('Sudoku', () => {
  test('searchForSolutions2 solves valid puzzles', () => {
    puzzles.forEach(puzzleStr => {
      const puzzle = new Sudoku(puzzleStr);
      let solutionCount = 0;
      puzzle.searchForSolutions2({
        solutionFoundCallback: () => {
          solutionCount++;
          return true; // continue searching
        }
      });
      expect(solutionCount).toBe(1);
    });
  });

  test('searchForSolutions2 finds all solutions', () => {
    [
      { puzzleStr: '...45.7...5........4......3.8...3.1.9..241..85.69...3.2..3...7.3...7..........3..', numSolutions: 1463 },
      { puzzleStr: '....5..89..8...16......1..2..76.3..............1..5..45...6..73.......4..74..89.1', numSolutions: 2361 },
      { puzzleStr: '12..5..8..7.3.9........7..6...56..9.....4.8......92..1....2...8.6.1.......8...6.5', numSolutions: 996 },
      { puzzleStr: '.2..56...8..3..56........3..1.2...........64.....9..239.........81.2....26..314..', numSolutions: 3171 },
      { puzzleStr: '.2.4.6..99...........79213.........1..9...3.........5.3.8....72...5......65.29..4', numSolutions: 4004 },
      { puzzleStr: '....5.7..56...8.4...9.7..61...6.....65...94.8..4....2.4.....836.3...7............', numSolutions: 1509 },
      { puzzleStr: '....56...76....52..95.2...3.......7.2.78...455...9.1...3.....5...8...3.......5...', numSolutions: 2132 },
      { puzzleStr: '..3.....9.7....65...9.71.345.1..78..9.43.2......54.......9..3............4.1.....', numSolutions: 322 },
      { puzzleStr: '1.......9.......4...4...2....2.....8..92..4.14.8....9..365...1.8.....5.6..56.8...', numSolutions: 5338 },
      { puzzleStr: '...45.................8..1..1...4...63......8..8...195...7..8.1.5..9.3.48.16...5.', numSolutions: 1589 },
      { puzzleStr: '..3.5.7.....2......4891..6.812.3.........5....9..8...........252.5.....1.795.....', numSolutions: 448 },
      { puzzleStr: '1..4..7.9......3...75.8.6143........8.43...6......4...2..1....6..8.........9.5..2', numSolutions: 3383 },
      { puzzleStr: '.2.......9.6.175..........34.....961.....5....7.9.4.......42...237.8...5....3..2.', numSolutions: 243 }
    ].forEach(({ puzzleStr, numSolutions }) => {
      const puzzle = new Sudoku(puzzleStr);
      let numSolutionsFound = 0;
      puzzle.searchForSolutions2({
        solutionFoundCallback: () => {
          numSolutionsFound++;
          return true; // continue searching
        }
      });
      expect(numSolutionsFound).toBe(numSolutions);
    });
  });

  describe('when sudoku is invalid', () => {
    test('searchForSolutions2 finds no solution in under 1 second or pizza is free', () => {
      invalidPuzzles.forEach(puzzleStr => {
        let count = 0;
        let solutions = [];
        const startTime = Date.now();
        new Sudoku(puzzleStr).searchForSolutions2({
          solutionFoundCallback: (s) => {
            count++;
            solutions.push(s);
            return count <= 1;
          }
        });
        const timeSpent = Date.now() - startTime;
        expect(count).toBe(0);
        expect(timeSpent).toBeLessThan(1000);
      });
    });

    test('firstSolution returns null', () => {
      invalidPuzzles.forEach(p => { expect(new Sudoku(p).firstSolution()).toBeNull(); });
    });

    test('solve returns false', () => {
      invalidPuzzles.forEach(p => { expect(new Sudoku(p).solve()).toBe(false); });
    });

    test('solutionsFlag returns 0', () => {
      invalidPuzzles.forEach(p => { expect(new Sudoku(p).solutionsFlag()).toBe(0); });
    });
  });


  test('Configuration generation', () => {
    for (let n = 0; n < 10; n++) {
      const config = Sudoku.generateConfig();
      expectPuzzleToBeValidAndSolvable({
        puzzle: config,
        expectedClues: config.board,
        solution: new Sudoku(config)
      });
    }
  });

  test('Puzzle generation', () => {
    const config = Sudoku.generatePuzzle(81);
    expectPuzzleToBeValidAndSolvable({
      puzzle: config,
      solution: config
    });

    for (let numClues = 80; numClues >= 27; numClues--) {
      const puzzle = Sudoku.generatePuzzle(numClues);
      const solution = new Sudoku(puzzle);
      solution.solve();
      expectPuzzleToBeValidAndSolvable({
        puzzle,
        solution
      });
    }
  });

  describe('fingerprint', () => {
    const gridStr = '218574639573896124469123578721459386354681792986237415147962853695318247832745961';
    const expected_fp2 = '9:f:b:d:3:7::1c';
    const expected_fp3 = '9::f::18:6:3b:d:36:6:32:9:d:5:39:2';
    /** @type {Sudoku} */
    let grid;

    beforeEach(() => {
      grid = new Sudoku(gridStr);
    });

    test('check known', () => {
      expect(grid.fingerprint_d(2)).toBe(expected_fp2);
      expect(grid.fingerprint_d(3)).toBe(expected_fp3);
    });

    test('fingerprint does not change under grid transformations', () => {
      const transforms = [
        () => grid.shuffleDigits(),
        () => grid.rotate90(),
        () => grid.reflectOverHorizontal(),
        () => grid.reflectOverVertical(),
        () => grid.reflectOverDiagonal(),
        () => grid.reflectOverAntidiagonal(),
        () => { // Swap bands
          const combo = randomCombo(3, 2);
          grid.swapBands(combo[0], combo[1]);
        },
        () => { // Swap stacks
          const combo = randomCombo(3, 2);
          grid.swapStacks(combo[0], combo[1]);
        },
        () => { // Swap rows within a band
          const band = (Math.random() * 3) | 0;
          const combo = randomCombo(3, 2);
          grid.swapRows(band * 3 + combo[0], band * 3 + combo[1]);
        },
        () => { // Swap columns within a stack
          const stack = (Math.random() * 3) | 0;
          const combo = randomCombo(3, 2);
          grid.swapColumns(stack * 3 + combo[0], stack * 3 + combo[1]);
        }
      ];

      const nTransforms = 33 + (100 * Math.random()) | 0;
      for (let i = 0; i < nTransforms; i++) {
        // const t = (transforms.length * Math.random()) | 0;
        transforms[(transforms.length * Math.random()) | 0]();

        // Check that the fingerprint is unchanged once in awhile.
        // Not after every transformation - to save time.
        if ((i % 17) === 0) {
          expect(grid.fingerprint_d(2)).toBe(expected_fp2);
        }
      }
      expect(grid.fingerprint_d(2)).toBe(expected_fp2);
      expect(grid.fingerprint_d(3)).toBe(expected_fp3);
    });
  });
});

/**
 * @typedef {Object} SudokuPuzzle
 * @property {string} puzzle
 * @property {string} solution
 */

/**
 * Returns a random puzzle from the provided list of puzzles.
 * @returns {SudokuPuzzle}
 */
function getRandomPuzzle() {
  const index = Math.floor(Math.random() * puzzles.length);
  return { ...puzzles[index] };
}

/**
 *
 * @param {Sudoku} puzzle
 */
function expectPuzzleToBeValid(puzzle) {
  for (let i = 0; i < 9; i++) {
    expect(
      puzzle.isRowValid(i),
      `Expected row ${i} to be valid:\n${puzzle.rowVals(i).join('')}`
    ).toBe(true);
    expect(
      puzzle.isColValid(i),
      `Expected col ${i} to be valid:\n${puzzle.colVals(i).join('')}`
    ).toBe(true);
    expect(
      puzzle.isRegionValid(i),
      `Expected region ${i} to be valid:\n${puzzle.regionVals(i).join('')}`
    ).toBe(true);
  }
  expect(puzzle.isValid()).toBe(true);
}

/**
 *
 * @param {Sudoku} puzzle
 */
function expectPuzzleToBeFull(puzzle) {
  const pBoard = puzzle.board;
  for (let ci = 0; ci < 81; ci++) {
    expect(
      pBoard[ci],
      `\nBoard not full @ cell ${ci}: ${puzzle.toString()}`
    ).not.toBe(0);
  }
  expect(puzzle.isFull()).toBe(true);
  expect(puzzle.numEmptyCells).toBe(0);
}

/**
 *
 * @param {object} options
 * @param {Sudoku} options.puzzle (Required) The puzzle under test.
 * @param {number[]} options.expectedClues Expected clues array in `puzzle`.
 * @param {Sudoku} options.solution Expected solution to `puzzle`.
 */
function expectPuzzleToBeValidAndSolvable({
  puzzle,
  expectedClues = puzzle.clues,
  solution = new Sudoku(puzzle)
}) {
  expect(
    puzzle.hasUniqueSolution(),
    `Puzzle does not have a unique solution:\n${puzzle.toString()}`
  ).toBe(true);

  expectPuzzleToBeValid(puzzle);

  expect(puzzle.clues).toEqual(expect.arrayContaining(expectedClues));
  const puzzleClues = puzzle.clues.reduce((count, clue) => (count += (clue > 0 ? 1 : 0)), 0);
  expect(puzzle.numEmptyCells).toBe(81 - puzzleClues);

  expect(puzzle.solve()).toBe(true);
  // Expect repeated calls to solve() to return true.
  expect(puzzle.solve()).toBe(true);
  expect(puzzle.hasUniqueSolution()).toBe(true);

  expectPuzzleToBeValid(puzzle);
  expectPuzzleToBeFull(puzzle);

  expect(puzzle.isSolved()).toBe(true);
  expect(puzzle.clues).toEqual(expect.arrayContaining(expectedClues));
  // Expect the puzzle to match the solution after solving.
  expect(puzzle.toString()).toBe(solution.toString());
  expect(puzzle.board).toEqual(expect.objectContaining(solution.board));
}
