import Piece from './Piece.js';
import Event from '../event/Event.js';

/**
 * Represents an event that can be emitted by a Blocky instance.
 */
export default class BlockyEvent extends Event {
  // Events that transmit a copy of the whole game state:
  /** Creates a new BlockyEvent with the given game's state. */
  static SETUP(blocky) { return new BlockyEvent('SETUP').withState(blocky); }
  /** Creates a new BlockyEvent with the given game's state. */
  static START(blocky) { return new BlockyEvent('START').withState(blocky); }
  /** Creates a new BlockyEvent with the given game's state. */
  static STOP(blocky) { return new BlockyEvent('STOP').withState(blocky); }
  /** Creates a new BlockyEvent with the given game's state. */
  static GAMELOOP(blocky) { return new BlockyEvent('GAMELOOP').withState(blocky); }
  /** Creates a new BlockyEvent with the given game's state. */
  static GAME_OVER(blocky) { return new BlockyEvent('GAME_OVER').withState(blocky); }

  // Events that transmit no extra data:
  /** Creates a new BlockyEvent with no extra data. */
  static PAUSE() { return new BlockyEvent('PAUSE'); }
  /** Creates a new BlockyEvent with no extra data. */
  static RESUME() { return new BlockyEvent('RESUME'); }
  /** Creates a new BlockyEvent with no extra data. */
  static GRAVITY_ENABLED() { return new BlockyEvent('GRAVITY_ENABLED'); }
  /** Creates a new BlockyEvent with no extra data. */
  static GRAVITY_DISABLED() { return new BlockyEvent('GRAVITY_DISABLED'); }

  // Events that transmit a copy the current piece:
  /** Creates a new BlockyEvent with the given game's current piece data. */
  static PIECE_CREATE(blocky) { return new BlockyEvent('PIECE_CREATE').withPieceData(blocky); }
  /** Creates a new BlockyEvent with the given game's current piece data. */
  static PIECE_SHIFT(blocky) { return new BlockyEvent('PIECE_SHIFT').withPieceData(blocky); }
  /** Creates a new BlockyEvent with the given game's current piece data. */
  static PIECE_ROTATE(blocky) { return new BlockyEvent('PIECE_ROTATE').withPieceData(blocky); }
  /** Creates a new BlockyEvent with the given game's current piece data. */
  static PIECE_PLACED(blocky) { return new BlockyEvent('PIECE_PLACED').withPieceData(blocky); }

  // Events that transmit partial game state:
  /**
   * Creates a new BlockyEvent with the given game's line clear data.
   *
   * @param blocky The Blocky instance to get the line clear data from.
   * @param lines The lines that were cleared.
   */
  static LINE_CLEAR(blocky, lines) {
    const state = blocky.getState();
    return new BlockyEvent('LINE_CLEAR', {
      lines,
      _linesCleared: state.linesCleared,
      _linesUntilNextLevel: state.linesUntilNextLevel
    });
  }

  /** Creates a new BlockyEvent with the given game's score data. */
  static SCORE_UPDATE(blocky) {
    return new BlockyEvent('SCORE_UPDATE').add({ _score: blocky.getState().score });
  }

  /** Creates a new BlockyEvent with the given game's level data. */
  static LEVEL_UPDATE(blocky) {
    return new BlockyEvent('LEVEL_UPDATE').add({ _level: blocky.getState().level });
  }

  /** Creates a new BlockyEvent with the given game's board data. */
  static BLOCKS(blocky) {
    return new BlockyEvent('BLOCKS').add({ _board: blocky.getState().board });
  }

  /** Contains the names of all BlockyEvents. */
  static ALL = Object.freeze([
    'SETUP', 'START', 'STOP', 'GAMELOOP', 'GAME_OVER',
    'PAUSE', 'RESUME', 'GRAVITY_ENABLED', 'GRAVITY_DISABLED',
    'PIECE_CREATE', 'PIECE_SHIFT', 'PIECE_ROTATE', 'PIECE_PLACED',
    'LINE_CLEAR', 'SCORE_UPDATE', 'LEVEL_UPDATE', 'BLOCKS'
  ]);

  /**
   * Creates a new BlockyEvent with the given name and optional data.
   * @param {string} name The name of the event.
   * @param {object} data The data to add to the event.
   */
  constructor(name, data = {}) {
    super(name, data);
  }

  /**
   * Adds the given data to the event.
   * @param {object} data The data to add.
   * @returns {BlockyEvent} This BlockyEvent.
   */
  add(data) {
    return super.add(data);
  }

  /**
   * Gets whether the event has 'state' as a data property.
   * @returns {boolean} True if the event has 'state' as a data property; false otherwise.
   */
  hasState() {
    return this.hasData('state');
  }

  /**
   * Adds the game state of the given blocky instance to the event.
   * @param {Blocky} blocky The blocky instance to get the game state from.
   * @returns {BlockyEvent} This BlockyEvent.
   */
  withState(blocky) {
    return this.add({ state: blocky.getState() });
  }

  /**
   * Adds the current piece of the given blocky instance to the event.
   * @param {Blocky} blocky The blocky instance to get the current piece from.
   * @returns {BlockyEvent} This BlockyEvent.
   */
  withPieceData(blocky) {
    return this.add({ _piece: Piece.copy(blocky.getState().piece) });
  }
};
