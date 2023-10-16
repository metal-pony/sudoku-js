import IEventRegistrar from "../event/IEventRegistrar";
import Coord from "../structs/Coord";
import BlockyState from "./BlockyState";

/**
 * Options for a new Blocky game.
 */
export type GameOptions = {
  /** The level to start the game at. */
  level: number;

  /** Whether to use the gravity effect and accompanying timer. */
  useGravity: boolean;

  /** Number of rows. */
  rows: number;

  /** Number of columns. */
  cols: number;

  /** The entry coordinates that pieces will start at. */
  entryCoord: Coord;

  /** The starting height of the game. */
  height: number;

  /** The number of lines to clear per level. */
  linesPerLevel: number | ((level: number) => number);
};

/**
 * An interface for interacting with a game of Blocky.
 */
export default interface IBlockyGame extends IEventRegistrar {
  /**
   * Sets up a new game, stopping it if in progress.
   *
   * @param options The options for the new game.
   */
  setup(options?: GameOptions): void;

  /**
   * Starts the game.
   * If the game is in progress, does nothing.
   */
  start(): void;

  /**
   * Stops the game.
   */
  stop(): void;

  /**
   * Whether the game is in progress.
   *
   * @returns Whether the game is in progress.
   */
  inProgress(): boolean;

  /**
   * Pauses the game.
   */
  pause(): void;

  /**
   * Resumes the game.
   */
  resume(): void;

  /**
   * Moves the current piece left.
   *
   * @returns Whether the move was successful.
   */
  moveLeft(): boolean;

  /**
   * Moves the current piece right.
   *
   * @returns Whether the move was successful.
   */
  moveRight(): boolean;

  /**
   * Moves the current piece up.
   *
   * @returns Whether the move was successful.
   */
  moveUp(): boolean;

  /**
   * Moves the current piece down.
   *
   * @returns Whether the move was successful.
   */
  moveDown(): boolean;

  /**
   * Rotates the current piece clockwise.
   *
   * @returns Whether the rotation was successful.
   */
  rotateClockwise(): boolean;

  /**
   * Rotates the current piece counter-clockwise.
   *
   * @returns Whether the rotation was successful.
   */
  rotateCounterClockwise(): boolean;

  /**
   * Gets the current state of the game.
   *
   * @returns The current state of the game.
   */
  getState(): BlockyState;

  /**
   * Stops the game and performs any necessary cleanup,
   * such as unregistering event listeners, disposing of timers, etc.
   */
  dispose(): void;
};
