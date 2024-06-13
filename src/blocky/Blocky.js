import Event from '../event/Event.js';
import EventBus from '../event/EventBus.js';
import Coord from '../structs/Coord.js';
import Move from '../structs/Move.js';
import Timer from '../util/Timer.js';
import BlockyEvent from './BlockyEvent.js';
import BlockyState from './BlockyState.js';

/**
 * @typedef {Object} GameOptions
 * @property {number} level The level to start the game at.
 * @property {boolean} useGravity Whether to use the gravity effect and accompanying timer.
 * @property {number} rows Number of rows.
 * @property {number} cols Number of columns.
 * @property {Coord} entryCoord The entry coordinates that pieces will start at.
 * @property {number} height The starting height of the game.
 * @property {number | ((level: number) => number)} linesPerLevel The number of lines to clear per level.
 */

const PIECE_PLACED_DELAY_MS = 250;
const POINTS_BY_LINES_CLEARED = Object.freeze([0, 40, 100, 300, 1200]);

/**
 * Controls a game of Blocky.
 */
export default class Blocky {
	static get PIECE_PLACED_DELAY_MS() { return PIECE_PLACED_DELAY_MS; }
	static get POINTS_BY_LINES_CLEARED() { return POINTS_BY_LINES_CLEARED; };

	/**
	 * @param {BlockyState} state
	 */
  constructor(state = new BlockyState()) {
    this.state = state;
		this.usingGravity = this.state.options.useGravity;

		/** @type {EventBus | null} */
		this.eventBus = null;

		/** @type {Timer | null} */
		this.gravityTimer = null;

		this.numTimerPushbacks = 0;
		this.ticksUntilNextGravity = 0;
  }

	/**
   * Sets up a new game, stopping it if in progress.
   * @param {GameOptions} options
   */
	setup(options) {
		if (this.state.hasStarted) {
			this.stop();
		}

		this.state.reset(options);
		this.usingGravity = this.state.options.useGravity;
		this.numTimerPushbacks = 0;
		this.ticksUntilNextGravity = 0;

		if (this.isGravityEnabled()) {
			this.enableGravity();
		} else {
			this.disableGravity();
		}

		this.throwEvent(BlockyEvent.SETUP(this));
	}

	// TODO set other game options through this (rows, cols, etc.)
	/**
   * Starts the game.
   * If the game is in progress, does nothing.
   */
	start() {
		if (this.state.hasStarted) {
			return;
		}

		this.state.hasStarted = true;
		this.nextPiece();

		if (this.usingGravity) {
			this.updateGravityTimerDelayMs();
			this.gravityTimer?.start(this.gravityDelayMsForLevel());
		}

		this.throwEvent(BlockyEvent.START(this));
	}

	/**
   * Stops the game.
   */
	stop() {
		this.state.isPaused = false;
		this.state.isGameOver = true;
		this.state.isClearingLines = false;
		this.state.placePiece();

		if (this.gravityTimer) {
			this.gravityTimer.stop();
		}

		this.throwEvent(BlockyEvent.STOP(this));
	}

	/**
   * Whether the game is in progress.
   * @returns {boolean} Whether the game is in progress.
   */
	inProgress() {
		return this.state.hasStarted && !this.state.isGameOver;
	}

	/**
	 * Pauses the game.
	 */
	pause() {
		if (this.state.isGameOver || this.state.isPaused || !this.state.hasStarted) {
			return;
		}

		this.state.isPaused = true;

		if (this.isGravityEnabled()) {
			// this.gravityTimer!.stop();
			this.gravityTimer.stop();
		}

		this.throwEvent(BlockyEvent.PAUSE());
	}

	/**
	 * Resumes the game.
	 */
	resume() {
		if (this.state.hasStarted && !this.state.isGameOver) {
			this.state.isPaused = false;
			if (this.isGravityEnabled()) {
				// TODO keep track of how much time was left on the timer
				// TODO when the game was paused. Resume the timer with that.
				this.gravityTimer?.start(this.gravityDelayMsForLevel());
			}
			this.throwEvent(BlockyEvent.RESUME());
		}
	}

	/**
	 * Moves the current piece left.
	 * @returns {boolean} Whether the move was successful.
	 */
	moveLeft() {
		return this.shift(0, -1);
	}

	/**
	 * Moves the current piece right.
	 * @returns {boolean} Whether the move was successful.
	 */
	moveRight() {
		return this.shift(0, 1);
	}

	/**
	 * Moves the current piece up.
	 * @returns {boolean} Whether the move was successful.
	 */
	moveUp() {
		return false;
	}

	/**
	 * Moves the current piece down.
	 * @returns {boolean} Whether the move was successful.
	 */
	moveDown() {
		return this.shift(1, 0);
	}

	/**
	 * Rotates the current piece clockwise.
	 * @returns {boolean} Whether the rotation was successful.
	 */
	rotateClockwise() {
		return this.handleRotation(Move.CLOCKWISE);
	}

	/**
	 * Rotates the current piece counter-clockwise.
	 * @returns {boolean} Whether the rotation was successful.
	 */
	rotateCounterClockwise() {
		return this.handleRotation(Move.COUNTERCLOCKWISE);
	}

	/**
	 * @returns {BlockyState} The current state of the game.
	 */
	getState() {
		return BlockyState.copy(this.state);
	}

	/**
	 * Stops the game and performs and necessary cleanup, like unregistering event listeners.
	 */
	dispose() {
		this.stop();
		BlockyEvent.ALL.forEach((eventName) => this.unregisterAllEventListeners(eventName));
		this.gravityTimer = null;
		this.eventBus = null;
	}

	/**
	 * Executes the game loop logic.
	 * If gravity is being used, this method is called automatically by the gravity timer.
	 * Otherwise, this method must be called manually.
	 */
	gameloop() {
		if (this.state.isGameOver || this.state.isPaused) {
			return;
		}

		this.numTimerPushbacks = 0;

		if (this.state.piece.isActive && !this.state.canPieceMove(Move.DOWN)) {
			//*kerplunk*
			//next loop should attempt to clear lines
			this.plotPiece();

			if (this.isGravityEnabled()) {
				// this.gravityTimer!.delay = Blocky.PIECE_PLACED_DELAY_MS;
				this.gravityTimer.delay = Blocky.PIECE_PLACED_DELAY_MS;
				this.ticksUntilNextGravity = 2;
			}
		} else if (!this.state.piece.isActive) {	// The loop after piece kerplunks
			if (this.attemptClearLines()) {
				this.ticksUntilNextGravity += 2;
				//check if we need to update level
				if (this.state.linesUntilNextLevel <= 0) { //level up!!
					this.increaseLevel();
				}
			} else {
				this.nextPiece();
				if (this.checkGameOver()) {
					return;
				}
			}
		} else {	//piece alive && not at bottom
			if (this.isGravityEnabled()) {
				if (this.ticksUntilNextGravity == 0) {
					this.shiftPiece(Move.DOWN);
					// this.throwEvent(BlockyEvent.PIECE_SHIFT(this));
				} else {
					this.ticksUntilNextGravity = Math.max(0, this.ticksUntilNextGravity - 1);
					if (this.ticksUntilNextGravity == 0) {
						this.updateGravityTimerDelayMs();
					}
				}
			}
		}

		this.throwEvent(BlockyEvent.GAMELOOP(this));
	}

  /**
	 * Returns points rewarded for clearing lines at a given level.
	 * @param {number} lines Number of lines cleared.
	 * @return {number} Points to reward.
	 */
	calcPointsForClearing(lines) {
		return Blocky.POINTS_BY_LINES_CLEARED[lines] * (this.state.level + 1);
	}

  /**
	 * Attempts to rotate the current piece clockwise.
	 * The piece may be shifted left or right to accomodate the rotation.
	 * TODO Clean up / consolidate the several rotation methods.
	 * @param {Move} move The rotation to attempt.
	 * Should be either Move.CLOCKWISE or Move.COUNTERCLOCKWISE.
	 * @return {boolean} True if the piece was successfully rotated; otherwise false.
	 */
	rotate(move) {
		const _move = this.state.tryRotation(move);

		if (_move.equals(Move.STAND)) {
			return false;
		}

		this.state.piece.move(_move);
		this.throwEvent(BlockyEvent.PIECE_ROTATE(this));

		return true;
	}

	/**
	 * Attempts to shift the current piece with the given offset.
	 * @param {Move} move The move to attempt.
	 * @return {boolean} True if the piece was successfully moved; otherwise false.
	 */
	//! NOTE: move.rotation is ignored
	shiftPiece(move) {
		if (this.state.canPieceMove(move)) {
			this.state.piece.move(move);
			this.throwEvent(BlockyEvent.PIECE_SHIFT(this));
			return true;
		}

		return false;
	}

	/**
	 * Plots the piece's block data to the board.
	 */
	plotPiece() {
		this.state.placePiece();
		this.throwEvent(BlockyEvent.PIECE_PLACED(this).add({
      _numPiecesDropped: this.state.numPiecesDropped
    }));
		this.throwEvent(BlockyEvent.BLOCKS(this));
	}

	/**
	 * Clears full lines and shift remaining blocks down.
	 * @return {number[]} List of cleared rows, or null if no rows were cleared.
	 */
	clearLines() {
		const fullRows = this.state.getFullRows();

		if (fullRows.length > 0) {
			for (
				let row = fullRows[fullRows.length - 1] - 1, numRowsToDrop = 1;
				row >= 0;
				row--
			) {
				// If row is to be cleared, +1 to the amount of rows to drop
				if (fullRows.includes(row)) {
					numRowsToDrop++;
					continue;
				}

				// If row is empty, then all rows above are empty too.
				// Clear rows (row + 1) through (row + numRowsToDrop)
				if (this.state.isRowEmpty(row)) {
					for (let clearingRow = row + 1; clearingRow <= row + numRowsToDrop; clearingRow++) {
						this.state.clearRow(clearingRow);
					}

					break;
				}

				// Shift row down by 'numRowsToDrop'
				this.state.copyRow(row, row + numRowsToDrop);
			}
		}

		return (fullRows.length === 0) ? [] : fullRows;
	}

	/**
	 * @return {boolean} True if gravity is enabled; otherwise false.
	 */
	isGravityEnabled() {
		return this.usingGravity;
	}

	/**
	 * Disables gravity if it is currently enabled.
	 */
	disableGravity() {
		this.usingGravity = false;

		if (this.gravityTimer) {
			this.gravityTimer.stop();
		}

		this.throwEvent(BlockyEvent.GRAVITY_DISABLED());
	}

	/**
	 * Enables the gravity effect and initializes the timer if necessary.
	 */
	enableGravity() {
		this.usingGravity = true;

		if (!this.gravityTimer) {
			this.gravityTimer = new Timer(this.gameloop.bind(this));
		}

		this.throwEvent(BlockyEvent.GRAVITY_ENABLED());
	}

	/**
	 * @returns {number} The delay (ms) for the current level.
	 */
  gravityDelayMsForLevel() {
    return Math.round((Math.pow(0.8 - (this.state.level) * 0.007, this.state.level)) * 1000.0);
  }

	/**
	 * Calculates and updates the amount of time between gravity ticks for the current level.
	 * @return {number} The calculated delay (ms).
	 */
	updateGravityTimerDelayMs() {
		const delay = this.gravityDelayMsForLevel();
		if (this.gravityTimer) {
			// this.gravityTimer!.delay = delay;
			this.gravityTimer.delay = delay;
		}
		return delay;
	}

	/**
	 * Attempts to clear full rows.
	 * @return {boolena} True if any row was cleared; otherwise false.
	 */
	attemptClearLines() {
		// TODO Refactor after clearLines() is refactored
		const lines = this.clearLines();

		if (lines.length > 0) {
			this.state.linesCleared += lines.length;
			this.state.score += this.calcPointsForClearing(lines.length);
			this.state.linesUntilNextLevel -= lines.length;
			this.state.isClearingLines = true;

			this.throwEvent(BlockyEvent.LINE_CLEAR(this, lines));
			this.throwEvent(BlockyEvent.SCORE_UPDATE(this));
			this.throwEvent(BlockyEvent.BLOCKS(this));
		}

		return lines.length > 0;
	}

	/**
	 * Determines whether the active piece is overlapped with any other blocks,
	 * which is the lose condition. If detected, the gameOver handler is called.
	 *
	 * @return {boolean} True if the game is over; otherwise false.
	 */
	checkGameOver() {
		if (this.state.isGameOver) {
			return true;
		}

		if (this.state.pieceOverlapsBlocks()) {
			this.gameOver();
			return true;
		}

		return false;
	}

	/**
	 * Increases the level by 1, and updates the gravity timer delay.
	 */
	increaseLevel() {
		this.state.level++;
		this.state.linesUntilNextLevel += this.state.getLinesPerLevel();
		this.updateGravityTimerDelayMs();
		this.throwEvent(BlockyEvent.LEVEL_UPDATE(this));
	}

	/**
	 * Resets the game state.
	 */
	// reset(): void {
	// 	this._state.reset();
	// 	this.numTimerPushbacks = 0;
	// 	this.ticksUntilNextGravity = 0;
	// 	this.throwEvent(BlockyEvent.RESET(this));
	// }

	/**
	 * Ends the game.
	 * This method is called when the active piece overlaps with any other blocks.
	 * The gravity timer is stopped.
	 */
	gameOver() {
		this.state.isGameOver = true;
		this.state.isPaused = false;
		this.state.isClearingLines = false;
		this.state.placePiece();

		if (this.isGravityEnabled()) {
			// this.gravityTimer!.stop();
			this.gravityTimer.stop();
		}

		this.throwEvent(BlockyEvent.GAME_OVER(this));
	}

	/**
	 * If the piece is active, rotation is attempted. If the piece cannot rotate in place,
	 * then it may be shifted left or right by a couple blocks to allow rotation.
	 * If the piece cannot rotate at all, then nothing happens.
	 *
	 * @param {Move} direction The direction to rotate.
	 * Must be either Move.CLOCKWISE or Move.COUNTERCLOCKWISE.
	 * @return {boolean} True if the piece was rotated; otherwise false.
	 */
	handleRotation(direction) {
		if (!this.state.piece.isActive || this.state.isPaused || this.state.isGameOver) {
			return false;
		}

		if (this.rotate(direction)) {
			// If next gravity tick will plop the piece, maybe rotation should delay that
			// a little to give the user time to make final adjustments.
			// This is an anti-frustration technique.
			if (!this.state.canPieceMove(Move.DOWN) && this.numTimerPushbacks < 4) {
				// if (gameTimer != null) {
				// 	gameTimer.resetTickDelay();
					// System.out.println(gameTimer.resetTickDelay());
				// }
				this.numTimerPushbacks++;
			}

			// this.throwEvent(BlockyEvent.PIECE_ROTATE(this));
			return true;
		}

		return false;
	}

	// TODO Clean up / consolidate the couple shift methods.
	/**
	 *
	 * @param {number} rowOffset
	 * @param {number} colOffset
	 * @returns {boolean}
	 */
	shift(rowOffset, colOffset) {
		const move = new Move(new Coord(rowOffset, colOffset), 0);
		if (this.shiftPiece(move)) {
			if (!this.state.canPieceMove(Move.DOWN) && this.numTimerPushbacks < 4) {
				this.numTimerPushbacks++;
			}

			if (this.isGravityEnabled() && rowOffset > 0) {
				if (this.ticksUntilNextGravity > 0) {
					this.ticksUntilNextGravity = 0;
					this.updateGravityTimerDelayMs();
				}

				// this.gravityTimer!.delayNextTick();
				this.gravityTimer.delayNextTick();
			}

			// this.throwEvent(BlockyEvent.PIECE_SHIFT(this));
			return true;
		}

		return false;
	}

	/*********************
		Event Handling
	**********************/
	/**
	 * @param {string} eventName
	 * @param {(Event) => void} listener
	 * @returns
	 */
	registerEventListener(eventName, listener) {
		this.eventBus = this.eventBus || new EventBus();
		return this.eventBus.registerEventListener(eventName, listener);
	}

	/**
	 *
	 * @param {string} eventName
	 * @param {(Event) => void} listener
	 * @returns {boolean}
	 */
	unregisterEventListener(eventName, listener) {
		return (this.eventBus) ? this.eventBus.unregisterEventListener(eventName, listener) : false;
	}

	/**
	 *
	 * @param {string} eventName
	 * @returns {boolean}
	 */
	unregisterAllEventListeners(eventName) {
		return (this.eventBus) ? this.eventBus.unregisterAllEventListeners(eventName) : false;
	}

	/**
	 * @param {Event} event
	 */
	throwEvent(event) {
		if (this.eventBus) {
			this.eventBus.throwEvent(event);
		}
	}

	/**
	 *
	 * @param {string} eventName
	 * @returns {boolean}
	 */
	hasListeners(eventName) {
		return (this.eventBus) ? this.eventBus.hasListeners(eventName) : false;
	}

	// static record PQEntry<T>(T data, int priority) implements Comparable<PQEntry<T>> {
	// 	@Override
	// 	public int compareTo(PQEntry<T> o) {
	// 		return (priority - o.priority);
	// 	}
	// }

	/**
	 * Helper to create a new search queue entry.
	 * The priority value is the sqrdist between given positions.
	 *
	 * @param newPosition Data value for the queue entry
	 * @param goalPosition Used to calculate the priority value.
	 * @return A new PQEntry with the given value and calculated priority.
	 */
	// PQEntry<Position> positionSearchEntry(Position newPosition, Position goalPosition) {
	// 	return new PQEntry<Position>(
	// 		new Position(newPosition),
	// 		newPosition.sqrdist(goalPosition)
	// 	);
	// }

	/**
	 * Resets the piece to the top of the board with the next shape.
	 */
	nextPiece() {
		this.state.resetPiece();
		this.throwEvent(BlockyEvent.PIECE_CREATE(this).add({
      _nextShapes: this.state.nextShapes
    }));
	}
}
