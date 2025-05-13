import { randomCombo } from '@metal-pony/counting-js';
import { Sudoku } from '../../index.js';
import puzzles from './puzzles24.js';
import { range, shuffle } from '../../src/util/arrays.js';

// A subset of `puzzles`, chosen at random.
const validPuzzles = shuffle(range(puzzles.length)).slice(0, 100).map(i => puzzles[i]);

const invalidPuzzles = [
  // Invalid because of digit clashing (col 7: 3...5.3.1)
  '1.2....3..9..1.........3..1.15...4...2.1...5.8.....1.6..1....3......1...2......1.',

  // Invalid because cell 0 has no candidates
  '.123456789...1...........1.1...........1...........1....1...........1...........1'
];

describe('Sudoku', () => {
  describe('searchForSolutions2', () => {
    describe('for valid sudoku puzzles', () => {
      test('finds the single solution', () => {
        validPuzzles.forEach(puzzleStr => {
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
    });

    describe('for invalid puzzles', () => {
      describe('with more than one solution', () => {
        test('finds the expected number of solutions', () => {
          [
            { puzzleStr: '...45.7...5........4......3.8...3.1.9..241..85.69...3.2..3...7.3...7..........3..', numSolutions: 1463 },
            { puzzleStr: '12..5..8..7.3.9........7..6...56..9.....4.8......92..1....2...8.6.1.......8...6.5', numSolutions: 996 },
            { puzzleStr: '....5.7..56...8.4...9.7..61...6.....65...94.8..4....2.4.....836.3...7............', numSolutions: 1509 },
            { puzzleStr: '....56...76....52..95.2...3.......7.2.78...455...9.1...3.....5...8...3.......5...', numSolutions: 2132 },
            { puzzleStr: '..3.....9.7....65...9.71.345.1..78..9.43.2......54.......9..3............4.1.....', numSolutions: 322 },
            { puzzleStr: '...45.................8..1..1...4...63......8..8...195...7..8.1.5..9.3.48.16...5.', numSolutions: 1589 },
            { puzzleStr: '..3.5.7.....2......4891..6.812.3.........5....9..8...........252.5.....1.795.....', numSolutions: 448 },
            { puzzleStr: '.2.......9.6.175..........34.....961.....5....7.9.4.......42...237.8...5....3..2.', numSolutions: 243 }
          ].forEach(({ puzzleStr, numSolutions }) => {
            const puzzle = new Sudoku(puzzleStr);
            /** @type {Set<string>} */
            const solutionSet = new Set();
            puzzle.searchForSolutions2({
              solutionFoundCallback: (solution) => {
                solutionSet.add(solution.toString());
                return true; // always continue the search
              }
            });
            expect(solutionSet.size).toBe(numSolutions);
          });

          /** @type {Set<string>} */
          const solutionSet = new Set();
          const start = Date.now();
          new Sudoku().searchForSolutions2({
            solutionFoundCallback: (solution) => {
              solutionSet.add(solution.toString());
              return solutionSet.size < 10_000;
            }
          });
          const end = Date.now();
          expect(solutionSet.size).toBe(10_000);
          expect(end - start).toBeLessThan(1000);
        });
      });

      describe('with no solutions', () => {
        test('finds no solutions', () => {
          invalidPuzzles.forEach(p => {
            const puzzle = new Sudoku(p);
            /** @type {Set<string>} */
            const solutionSet = new Set();
            puzzle.searchForSolutions2({
              solutionFoundCallback: (solution) => {
                solutionSet.add(solution.toString());
                return true; // always continue the search
              }
            });
            expect(solutionSet.size).toBe(0);
          });
        });
      });
    });
  });

  describe('solutionsFlag', () => {
    describe('for valid puzzles', () => {
      test('returns 1', () => {
        validPuzzles.forEach(p => {
          expect(new Sudoku(p).solutionsFlag()).toBe(1);
        });
      });
    });

    describe('for invalid puzzles', () => {
      describe('with more than one solution', () => {
        test('returns 2', () => {
          [
            { puzzleStr: '...45.7...5........4......3.8...3.1.9..241..85.69...3.2..3...7.3...7..........3..', numSolutions: 1463 },
            { puzzleStr: '12..5..8..7.3.9........7..6...56..9.....4.8......92..1....2...8.6.1.......8...6.5', numSolutions: 996 },
            { puzzleStr: '....5.7..56...8.4...9.7..61...6.....65...94.8..4....2.4.....836.3...7............', numSolutions: 1509 },
            { puzzleStr: '....56...76....52..95.2...3.......7.2.78...455...9.1...3.....5...8...3.......5...', numSolutions: 2132 },
            { puzzleStr: '..3.....9.7....65...9.71.345.1..78..9.43.2......54.......9..3............4.1.....', numSolutions: 322 },
            { puzzleStr: '...45.................8..1..1...4...63......8..8...195...7..8.1.5..9.3.48.16...5.', numSolutions: 1589 },
            { puzzleStr: '..3.5.7.....2......4891..6.812.3.........5....9..8...........252.5.....1.795.....', numSolutions: 448 },
            { puzzleStr: '.2.......9.6.175..........34.....961.....5....7.9.4.......42...237.8...5....3..2.', numSolutions: 243 }
          ].forEach(({ puzzleStr, numSolutions }) => {
            expect(new Sudoku(puzzleStr).solutionsFlag()).toBe(2);
          });

          // Empty puzzle
          expect(new Sudoku().solutionsFlag()).toBe(2);
        });
      });

      describe('with no solutions', () => {
        test('returns 0', () => {
          invalidPuzzles.forEach(p => {
            expect(new Sudoku(p).solutionsFlag()).toBe(0);
          });
        });
      });
    });
  });

  test('generateConfig', () => {
    for (let n = 0; n < 10; n++) {
      const grid = Sudoku.generateConfig();
      expect(grid.numEmptyCells).toBe(0);
      expect(grid.isSolved()).toBe(true);
      expect(grid.solutionsFlag()).toBe(1);
    }
  });

  test('generatePuzzle2', () => {
    for (let numClues = 81; numClues >= 22; numClues--) {
      const puzzle = Sudoku.generatePuzzle2({ numClues });
      expect(puzzle.numEmptyCells).toBe(81 - numClues);
      expect(puzzle.isSolved()).toBe(numClues === 81);
      expect(puzzle.solutionsFlag()).toBe(1);
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

      const nTransforms = 25;
      for (let i = 0; i < nTransforms; i++) {
        transforms[(transforms.length * Math.random()) | 0]();
        // Check that the fingerprint is unchanged once in awhile.
        // Not after every transformation - to save time.
        if ((i % 3) === 0) {
          expect(grid.fingerprint_d(2)).toBe(expected_fp2);
        }
      }
      expect(grid.fingerprint_d(2)).toBe(expected_fp2);
      expect(grid.fingerprint_d(3)).toBe(expected_fp3);
    });
  });
});
