import { randomCombo } from '@metal-pony/counting-js';
import { Sudoku, sudoku17 } from '../../index.js';
import puzzles from './puzzles24.json';
import { range, shuffle } from '../../src/util/arrays.js';
import { cellRegion, DIGITS, isAreaValid, SearchState, SPACES } from '../../src/sudoku/Sudoku.js';

// A subset of `puzzles`, chosen at random.
const SINGLE_SOLUTION_PUZZLES = shuffle(range(puzzles.length)).slice(0, 100).map(i => puzzles[i]);

const NO_SOLUTION_PUZZLES = [
  // Invalid because of digit clashing (col 7: 3...5.3.1)
  '1.2....3..9..1.........3..1.15...4...2.1...5.8.....1.6..1....3......1...2......1.',

  // Invalid because cell 0 has no candidates
  '.123456789...1...........1.1...........1...........1....1...........1...........1'
];

const MULTI_SOLUTION_PUZZLES = [
  { puzzleStr: '...45.7...5........4......3.8...3.1.9..241..85.69...3.2..3...7.3...7..........3..', numSolutions: 1463 },
  { puzzleStr: '....5..89..8...16......1..2..76.3..............1..5..45...6..73.......4..74..89.1', numSolutions: 2361 },
  { puzzleStr: '12..5..8..7.3.9........7..6...56..9.....4.8......92..1....2...8.6.1.......8...6.5', numSolutions: 996 },
  { puzzleStr: '1..45...96...1......7...1..3......5.9....531.......6...9.16.......3.4.6.2...7...1', numSolutions: 5076 },
  { puzzleStr: '.2..56...8..3..56........3..1.2...........64.....9..239.........81.2....26..314..', numSolutions: 3171 },
  { puzzleStr: '.2.4.6..99...........79213.........1..9...3.........5.3.8....72...5......65.29..4', numSolutions: 4004 },
  { puzzleStr: '....5.7..56...8.4...9.7..61...6.....65...94.8..4....2.4.....836.3...7............', numSolutions: 1509 },
  { puzzleStr: '....56...76....52..95.2...3.......7.2.78...455...9.1...3.....5...8...3.......5...', numSolutions: 2132 },
  { puzzleStr: '..3.....9.7....65...9.71.345.1..78..9.43.2......54.......9..3............4.1.....', numSolutions: 322 },
  { puzzleStr: '1.......9.......4...4...2....2.....8..92..4.14.8....9..365...1.8.....5.6..56.8...', numSolutions: 5338 },
  { puzzleStr: '...45.................8..1..1...4...63......8..8...195...7..8.1.5..9.3.48.16...5.', numSolutions: 1589 },
  { puzzleStr: '..3.5.7.....2......4891..6.812.3.........5....9..8...........252.5.....1.795.....', numSolutions: 448 },
  { puzzleStr: '1..4..7.9......3...75.8.6143........8.43...6......4...2..1....6..8.........9.5..2', numSolutions: 3383 },
  { puzzleStr: '.2.......9.6.175..........34.....961.....5....7.9.4.......42...237.8...5....3..2.', numSolutions: 243 },
];

describe('isAreaValid', () => {
  describe('when areaDigits is empty or contains no nonzero digits', () => {
    test('returns true', () => {
      expect(isAreaValid([])).toBe(true);
      expect(isAreaValid([0])).toBe(true);
      expect(isAreaValid([0, 0, 0])).toBe(true);
    });
  });

  describe('when areaDigits contains no duplicate digits', () => {
    test('returns true', () => {
      expect(isAreaValid([1, 2, 3])).toBe(true);
      expect(isAreaValid([1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(true);
      expect(isAreaValid([1, 2, 3, 4, 0, 6, 7, 8, 0])).toBe(true);
    });
  });

  describe('when areaDigits contains duplicate digits', () => {
    test('returns false', () => {
      expect(isAreaValid([1, 2, 3, 4, 5, 6, 7, 8, 1])).toBe(false);
      expect(isAreaValid([4, 0, 0, 0, 0, 0, 0, 0, 4])).toBe(false);
    });
  });
});

describe('SearchState', () => {
  /** @type {SearchState} */
  let search;

  beforeEach(() => {
    search = new SearchState();
  });

  describe('numSolutions', () => {
    test('finds the correct number of solutions (1)', () => {
      SINGLE_SOLUTION_PUZZLES.forEach(p => {
        const puzzle = new Sudoku(p);
        search.init(puzzle);
        while (search.advanceToSolution());
        expect(search.numSolutions).toBe(1);
      });
    });

    test('finds the correct number of solutions (0)', () => {
      NO_SOLUTION_PUZZLES.forEach(p => {
        const puzzle = new Sudoku(p);
        search.init(puzzle);
        while (search.advanceToSolution());
        expect(search.numSolutions).toBe(0);
      });
    });

    test('finds the correct number of solutions (many)', () => {
      MULTI_SOLUTION_PUZZLES.forEach(({ puzzleStr, numSolutions }) => {
        const puzzle = new Sudoku(puzzleStr);
        search.init(puzzle);
        while (search.advanceToSolution());
        expect(search.numSolutions).toBe(numSolutions);
      });
    });

  });

  describe('when puzzle has multiple solutions', () => {
    test('all solutions found are unique', () => {
      MULTI_SOLUTION_PUZZLES.forEach(({ puzzleStr, numSolutions }) => {
        const puzzle = new Sudoku(puzzleStr);
        search.init(puzzle);
        /** @type {Set<string>} */
        const solutionSet = new Set();
        while (search.advanceToSolution()) {
          solutionSet.add(new Sudoku(search.solution));
        }
        expect(solutionSet.size).toBe(numSolutions);
      });
    });
  });
});

describe('Sudoku', () => {
  describe('static', () => {
    describe('validateStr', () => {
      describe('returns false', () => {
        test('when the string is not given', () => {
          expect(Sudoku.validateStr()).toBe(false);
          expect(Sudoku.validateStr(null)).toBe(false);
          expect(Sudoku.validateStr(undefined)).toBe(false);
        });

        test('when str is not a string', () => {
          expect(Sudoku.validateStr(123)).toBe(false);
          expect(Sudoku.validateStr({})).toBe(false);
          expect(Sudoku.validateStr(['meow'])).toBe(false);
        });

        test('when str is long', () => {
          expect(Sudoku.validateStr('.'.repeat(SPACES + 1))).toBe(false);
        });

        test('when expanded str is not the correct length', () => {
          expect(Sudoku.validateStr('--------')).toBe(false);
          expect(Sudoku.validateStr('.'.repeat(SPACES - 1))).toBe(false);
        });

        test('when str contains invalid characters', () => {
          expect(Sudoku.validateStr('a'.repeat(SPACES))).toBe(false);
          expect(Sudoku.validateStr('1'.repeat(SPACES - 1) + 'A')).toBe(false);
        });
      });

      describe('returns true', () => {
        test('when str is correct length containing only numbers and dots', () => {
          const validStr = '123456789'.repeat(9);
          expect(Sudoku.validateStr(validStr)).toBe(true);

          [
            ...SINGLE_SOLUTION_PUZZLES,
            ...NO_SOLUTION_PUZZLES,
            ...(MULTI_SOLUTION_PUZZLES.map(p => p.puzzleStr))
          ].forEach(p => {
            expect(Sudoku.validateStr(p)).toBe(true);
          });
        });

        test('when str expands to correct length containing only numbers and dots', () => {
          const validStrs = [
            '.'.repeat(72) + '-',
            '-' + '.'.repeat(72),
            '1' + '.'.repeat(71) + '-',
            '-' + '1' + '.'.repeat(71),
            '1' + '.'.repeat(70) + '-1',
            '1' + '.'.repeat(70) + '-9',
          ];

          validStrs.forEach(str => {
            expect(Sudoku.validateStr(str)).toBe(true);
          });
        });

        test('the str does not necessarily need to represent a valid sudoku', () => {
          expect(Sudoku.validateStr('1'.repeat(SPACES))).toBe(true);
        });
      });
    });

    describe('fromString', () => {
      describe('when str is invalid in any way', () => {
        test('throws error', () => {
          // Invalid because of length
          expect(() => Sudoku.fromString('.'.repeat(SPACES - 1))).toThrow();

          // Invalid because str did not expand to correct length
          expect(() => Sudoku.fromString('1' + '.'.repeat(70) + '-')).toThrow();
          expect(() => Sudoku.fromString('1' + '.'.repeat(72) + '-')).toThrow();

          // Invalid because of invalid characters
          expect(() => Sudoku.fromString('1'.repeat(SPACES - 1) + 'A')).toThrow();

          // Invalid because of invalid characters after expansion
          expect(() => Sudoku.fromString('-' + '.'.repeat(71) + '!')).toThrow();
        });
      });

      describe('when str represents a grid', () => {
        test('returns a grid with the correct digits set', () => {
          const puzzleStr = '123456789'.repeat(9);
          const grid = Sudoku.fromString(puzzleStr);
          expect(grid.toString()).toBe(puzzleStr);
        });
      });
    });

    describe('generateConfig', () => {
      test('is full and solved', () => {
        for (let n = 0; n < 10; n++) {
          const config = Sudoku.generateConfig();
          expect(config.numEmptyCells).toBe(0);
          expect(config.isValid()).toBe(true);
          expect(config.isFull()).toBe(true);
          expect(config.isSolved()).toBe(true);
          expect(config.solutionsFlag()).toBe(1);
        }
      });
    });

    test('generatePuzzle2', () => {
      for (let numClues = 81; numClues >= 24; numClues--) {
        const puzzle = Sudoku.generatePuzzle2({ numClues });
        expect(puzzle.numEmptyCells).toBe(81 - numClues);
        expect(puzzle.solutionsFlag()).toBe(1);
      }
    });
  });

  describe('setBoard', () => {
    describe('throws error', () => {
      test('when digits is incorrect length', () => {
        expect(() => new Sudoku().setBoard([])).toThrow();
        expect(() => new Sudoku().setBoard([1, 2, 3])).toThrow();
        expect(() => new Sudoku().setBoard(Array(SPACES - 1).fill(0))).toThrow();
        expect(() => new Sudoku().setBoard(Array(SPACES + 1).fill(0))).toThrow();
      });

      test('when any element is not a number', () => {
        const digits = Array(SPACES).fill(0);
        digits[0] = 'x';
        expect(() => new Sudoku().setBoard(digits)).toThrow();
      });

      test('when any element is out of bounds', () => {
        const digits = Array(SPACES).fill(0);
        digits[0] = 10;
        expect(() => new Sudoku().setBoard(digits)).toThrow();
      });
    });

    test('sets the board digits appropriately', () => {
      const digits = Array(SPACES).fill(0);
      digits[0] = 5;
      digits[80] = 9;
      const grid = new Sudoku();
      grid.setBoard(digits);
      expect(grid.board).toEqual(digits);
      expect(grid.numEmptyCells).toBe(79);
      expect(grid.isValid()).toBe(true);
    });

    describe('-integration-', () => {
      describe('when data represents a valid grid', () => {
        test('grid is solvable and has correct properties', () => {
          // Pull from puzzles24
          SINGLE_SOLUTION_PUZZLES.forEach(p => {
            const digits = p.split('').map(c => (c === '.' ? 0 : Number(c)));
            const grid = new Sudoku();
            grid.setBoard(digits);
            expect(grid.isValid()).toBe(true);
            expect(grid.isFull()).toBe(false);
            expect(grid.isSolved()).toBe(false);
            expect(grid.numEmptyCells).toBe(81 - 24);
            expect(grid.solutionsFlag()).toBe(1);
          });

          // Pull from a subset of sudoku17
          const sudoku17Subset = [];
          for (let i = 0; i < 20; i++) {
            const si = (Math.random() * sudoku17.length) | 0;
            sudoku17Subset.push(sudoku17[si]);
          }
          sudoku17Subset.forEach(p => {
            const digits = p.split('').map(c => (c === '.' ? 0 : Number(c)));
            const grid = new Sudoku();
            grid.setBoard(digits);
            expect(grid.isValid()).toBe(true);
            expect(grid.isFull()).toBe(false);
            expect(grid.isSolved()).toBe(false);
            expect(grid.numEmptyCells).toBe(81 - 17);
            expect(grid.solutionsFlag()).toBe(1);
          });
        });

        test('board returns array identical to the given digits', () => {
          const digits = Array(SPACES).fill(0);
          digits[0] = 7;
          digits[4] = 3;
          const grid = new Sudoku();
          grid.setBoard(digits);
          expect(grid.board).toEqual(digits);
          expect(grid.board).not.toBe(digits);
        });
      });
    });
  });

  describe('solutionCount', () => {
    test('finds the expected number of solutions', () => {
      SINGLE_SOLUTION_PUZZLES.forEach(p => {
        expect(new Sudoku(p).solutionCount()).toBe(1);
      });

      NO_SOLUTION_PUZZLES.forEach(p => {
        expect(new Sudoku(p).solutionCount()).toBe(0);
      });

      MULTI_SOLUTION_PUZZLES.forEach(({ puzzleStr, numSolutions }) => {
        expect(new Sudoku(puzzleStr).solutionCount()).toBe(numSolutions);
      });
    });
  });

  describe('solutionsFlag', () => {
    test('returns 2 for empty puzzles', () => {
      expect(new Sudoku().solutionsFlag()).toBe(2);
    });

    test('returns 1 for valid puzzles', () => {
      SINGLE_SOLUTION_PUZZLES.forEach(p => {
        expect(new Sudoku(p).solutionsFlag()).toBe(1);
      });
    });

    test('returns 0 for puzzles with no solutions', () => {
      NO_SOLUTION_PUZZLES.forEach(p => {
        expect(new Sudoku(p).solutionsFlag()).toBe(0);
      });
    });

    test('returns 2 for puzzles with multiple solutions', () => {
      MULTI_SOLUTION_PUZZLES.forEach(({ puzzleStr }) => {
        expect(new Sudoku(puzzleStr).solutionsFlag()).toBe(2);
      });
    });

    test('returns 1 for generated configs', () => {
      for (let n = 0; n < 10; n++) {
        expect(Sudoku.generateConfig().solutionsFlag()).toBe(1);
      }
    });

    describe('when a config has some non-intersecting digits cleared', () => {
      test('returns 1', () => {
        const config = Sudoku.generateConfig();

        // Collect indices of cells within the diagonal regions
        const cellsToRemove = shuffle(range(SPACES).filter(ci => {
          const r = cellRegion(ci);
          return (r === 0 || r === 4 || r === 8);
        }));

        cellsToRemove.forEach(ci => {
          config.setDigit(0, ci);
          expect(config.solutionsFlag()).toBe(1);
        });
      });
    });
  });

  describe('fingerprint', () => {
    const gridStr = '218574639573896124469123578721459386354681792986237415147962853695318247832745961';
    const expected_dc2 = '9:9:7:4:2:3::16';
    const expected_dc3 = '9::f::f:1:11:5:f:5:f:c:f:9:3d:e:16:25:21:8:8';
    /** @type {Sudoku} */
    let grid;

    beforeEach(() => {
      grid = new Sudoku(gridStr);
    });

    test('check known', () => {
      expect(grid.dc2()).toBe(expected_dc2);
      expect(grid.dc3()).toBe(expected_dc3);
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
          expect(grid.dc2()).toBe(expected_dc2);
        }
      }
      expect(grid.dc2()).toBe(expected_dc2);
      // Disabled for performance.
      // expect(grid.dc3()).toBe(expected_dc3);
    });
  });

  describe('shake', () => {
    test('when grid is empty, does nothing', () => {
      const grid = new Sudoku();
      // Copy of grid to preserve original state for comparison.
      const originalGridCopy = new Sudoku(grid);

      grid.shake();

      expect(grid).toStrictEqual(originalGridCopy);
    });

    test('when grid is invalid, does nothing', () => {
      // Test with a generated config and set _isValid = false,
      // or set the first 2 cells to the same digit.
      const grid = Sudoku.generateConfig();
      grid.setDigit(1, 0);
      grid.setDigit(1, 1);
      const originalGridCopy = new Sudoku(grid);
      grid.shake();
      expect(grid).toStrictEqual(originalGridCopy);

      // Test with NO_SOLUTION_PUZZLES and MULTI_SOLUTION_PUZZLES
      NO_SOLUTION_PUZZLES.forEach(p => {
        const grid = new Sudoku(p);
        const originalGridCopy = new Sudoku(grid);
        grid.shake();
        expect(grid).toStrictEqual(originalGridCopy);
      });

      MULTI_SOLUTION_PUZZLES.forEach(({ puzzleStr }) => {
        const grid = new Sudoku(puzzleStr);
        const originalGridCopy = new Sudoku(grid);
        grid.shake();
        expect(grid).toStrictEqual(originalGridCopy);
      });
    });

    /**
     * @param {Sudoku} grid
     */
    const expectGridToBeIrreducable = (grid) => {
      for (let ci = 0; ci < SPACES; ci++) {
        if (grid.getDigit(ci) === 0) continue;
        const clone = new Sudoku(grid);
        clone.setDigit(0, ci);
        expect(clone.hasUniqueSolution()).toBe(false);
      }
    };

    describe('when grid is valid', () => {
      test('no remaining digit can be removed', () => {
        // Test with several puzzle from the sudoku-17 file.
        for (let i = 0; i < 10; i++) {
          const si = (Math.random() * sudoku17.length) | 0;
          const grid = new Sudoku(sudoku17[si]);
          grid.shake();
          expectGridToBeIrreducable(grid);
        }

        // Test several times with generated configs.
        for (let i = 0; i < 10; i++) {
          const grid = Sudoku.generateConfig();
          grid.shake();
          expectGridToBeIrreducable(grid);
          expect(grid.numEmptyCells).toBeGreaterThan(0);
        }

        // Test with SINGLE_SOLUTION_PUZZLES.
        const ENDI = Math.min(10, SINGLE_SOLUTION_PUZZLES.length);
        for (let i = 0; i < ENDI; i++) {
          const grid = new Sudoku(SINGLE_SOLUTION_PUZZLES[i]);
          grid.shake();
          expectGridToBeIrreducable(grid);
        }
      });

      test('resulting grid is solvable', () => {
        // Test several times with generated configs.
        for (let i = 0; i < 10; i++) {
          const grid = Sudoku.generateConfig();
          grid.shake();
          expect(grid.hasUniqueSolution()).toBe(true);
        }
      });
    });
  });
});
