import Piece from './Piece';
import Blocky from './Blocky';
import { Event, EventData } from '../event/Event';

/**
 * Represents an event that can be emitted by a Blocky instance.
 */
export default class BlockyEvent extends Event {
  // Events that transmit a copy of the whole game state:
  /** Creates a new BlockyEvent with the given game's state. */
  static SETUP(blocky: Blocky): BlockyEvent { return new BlockyEvent('SETUP').withState(blocky); }
  /** Creates a new BlockyEvent with the given game's state. */
  static START(blocky: Blocky): BlockyEvent { return new BlockyEvent('START').withState(blocky); }
  /** Creates a new BlockyEvent with the given game's state. */
  static STOP(blocky: Blocky): BlockyEvent { return new BlockyEvent('STOP').withState(blocky); }
  /** Creates a new BlockyEvent with the given game's state. */
  static GAMELOOP(blocky: Blocky): BlockyEvent { return new BlockyEvent('GAMELOOP').withState(blocky); }
  /** Creates a new BlockyEvent with the given game's state. */
  static GAME_OVER(blocky: Blocky): BlockyEvent { return new BlockyEvent('GAME_OVER').withState(blocky); }

  // Events that transmit no extra data:
  /** Creates a new BlockyEvent with no extra data. */
  static PAUSE(): BlockyEvent { return new BlockyEvent('PAUSE'); }
  /** Creates a new BlockyEvent with no extra data. */
  static RESUME(): BlockyEvent { return new BlockyEvent('RESUME'); }
  /** Creates a new BlockyEvent with no extra data. */
  static GRAVITY_ENABLED(): BlockyEvent { return new BlockyEvent('GRAVITY_ENABLED'); }
  /** Creates a new BlockyEvent with no extra data. */
  static GRAVITY_DISABLED(): BlockyEvent { return new BlockyEvent('GRAVITY_DISABLED'); }

  // Events that transmit a copy the current piece:
  /** Creates a new BlockyEvent with the given game's current piece data. */
  static PIECE_CREATE(blocky: Blocky): BlockyEvent { return new BlockyEvent('PIECE_CREATE').withPieceData(blocky); }
  /** Creates a new BlockyEvent with the given game's current piece data. */
  static PIECE_SHIFT(blocky: Blocky): BlockyEvent { return new BlockyEvent('PIECE_SHIFT').withPieceData(blocky); }
  /** Creates a new BlockyEvent with the given game's current piece data. */
  static PIECE_ROTATE(blocky: Blocky): BlockyEvent { return new BlockyEvent('PIECE_ROTATE').withPieceData(blocky); }
  /** Creates a new BlockyEvent with the given game's current piece data. */
  static PIECE_PLACED(blocky: Blocky): BlockyEvent { return new BlockyEvent('PIECE_PLACED').withPieceData(blocky); }

  // Events that transmit partial game state:
  /**
   * Creates a new BlockyEvent with the given game's line clear data.
   *
   * @param blocky The Blocky instance to get the line clear data from.
   * @param lines The lines that were cleared.
   */
  static LINE_CLEAR(blocky: Blocky, lines: number[]): BlockyEvent {
    const state = blocky.getState();
    return new BlockyEvent('LINE_CLEAR', {
      lines,
      _linesCleared: state.linesCleared,
      _linesUntilNextLevel: state.linesUntilNextLevel
    });
  }

  /** Creates a new BlockyEvent with the given game's score data. */
  static SCORE_UPDATE(blocky: Blocky): BlockyEvent {
    return new BlockyEvent('SCORE_UPDATE').add({ _score: blocky.getState().score });
  }

  /** Creates a new BlockyEvent with the given game's level data. */
  static LEVEL_UPDATE(blocky: Blocky): BlockyEvent {
    return new BlockyEvent('LEVEL_UPDATE').add({ _level: blocky.getState().level });
  }

  /** Creates a new BlockyEvent with the given game's board data. */
  static BLOCKS(blocky: Blocky): BlockyEvent {
    return new BlockyEvent('BLOCKS').add({ _board: blocky.getState().board });
  }

  /** Contains the names of all BlockyEvents. */
  static readonly ALL: string[] = [
    'SETUP', 'START', 'STOP', 'GAMELOOP', 'GAME_OVER',
    'PAUSE', 'RESUME', 'GRAVITY_ENABLED', 'GRAVITY_DISABLED',
    'PIECE_CREATE', 'PIECE_SHIFT', 'PIECE_ROTATE', 'PIECE_PLACED',
    'LINE_CLEAR', 'SCORE_UPDATE', 'LEVEL_UPDATE', 'BLOCKS'
  ];

  /**
   * Creates a new BlockyEvent with the given name and optional data.
   */
  constructor(name: string, data: EventData = {}) {
    super(name, data);
  }

  /**
   * Adds the given data to the event.
   *
   * @param data The data to add.
   * @returns This BlockyEvent.
   */
  add(data: EventData): BlockyEvent {
    return super.add(data) as BlockyEvent;
  }

  /**
   * Gets whether the event has 'state' as a data property.
   *
   * @returns True if the event has 'state' as a data property; false otherwise.
   */
  hasState(): boolean {
    return this.hasData('state');
  }

  /**
   * Adds the game state of the given blocky instance to the event.
   *
   * @param blocky The blocky instance to get the game state from.
   * @returns This BlockyEvent.
   */
  withState(blocky: Blocky): BlockyEvent {
    return this.add({ state: blocky.getState() });
  }

  /**
   * Adds the current piece of the given blocky instance to the event.
   *
   * @param blocky The blocky instance to get the current piece from.
   * @returns This BlockyEvent.
   */
  withPieceData(blocky: Blocky): BlockyEvent {
    return this.add({ _piece: Piece.copy(blocky.getState().piece) });
  }
};

/** Contains the names of all BlockyEvents. */
export type BlockyEventName =
  'SETUP' | 'START' | 'STOP' | 'GAMELOOP' | 'GAME_OVER' |
  'PAUSE' | 'RESUME' | 'GRAVITY_ENABLED' | 'GRAVITY_DISABLED' |
  'PIECE_CREATE' | 'PIECE_SHIFT' | 'PIECE_ROTATE' | 'PIECE_PLACED' |
  'LINE_CLEAR' | 'SCORE_UPDATE' | 'LEVEL_UPDATE' | 'BLOCKS';
