import Sudoku, {
  RANK,
  DIGITS,
  SPACES,
  ALL,
  MIN_CLUES,
  encode, decode, isDigit,
  cellMask,
  digitMask,
  cellsFromMask,
  indicesFor,
  masksFor,
  cellRow,
  cellCol,
  cellRegion,
  cellRegion2D,
  SearchState,
  forEachCandidate
} from './src/sudoku/Sudoku.js';

import SudokuSieve, {
  searchForItemsFromMask,
  seedSieveDc,
  seedSieveFp,
  getDigitComboMasks,
  getAreaComboMasks,
} from './src/sudoku/SudokuSieve.js';

import sudoku17 from './src/sudoku/sudoku-17.json' with { type: 'json' };

export {
  RANK,
  DIGITS,
  SPACES,
  ALL,
  MIN_CLUES,
  indicesFor,
  masksFor,
  encode, decode, isDigit,
  digitMask, cellMask, cellsFromMask,
  cellRow, cellCol, cellRegion, cellRegion2D,
  Sudoku,
  SearchState,
  SudokuSieve,
  searchForItemsFromMask,
  seedSieveDc, seedSieveFp,
  getDigitComboMasks, getAreaComboMasks,
  forEachCandidate,
  sudoku17
};
