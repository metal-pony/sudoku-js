import { EventBus } from '../event/EventBus.js';
import Debugger from '../util/debug.js';
import Sudoku from './Sudoku';

/**
 * @callback SolutionFoundCallback
 * @param {Sudoku} sudoku
 * @returns {boolean} If `true`, the search will continue for more solutions.
 */

const debug = new Debugger(false);

/**
 * Represents a Sudoku board.
 */
export class SudokuGame extends Sudoku {
  constructor(data) {
    super(data);

    this._eventBus = new EventBus();
  }

  addEventListener(event, callback) {
    this._eventBus.registerEventListener(event, callback);
  }

  removeEventListener(event, callback) {
    this._eventBus.unregisterEventListener(event, callback);
  }

  dispose() {
    // TODO create an unregisterAll method for EventBus
    // this._eventBus.unregisterAll();
  }

}

export default SudokuGame;
