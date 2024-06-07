import Coord from '../structs/Coord';
import Move from '../structs/Move';
import Position from '../structs/Position';
import { bounded, validatePositiveInteger } from '../util/Util';
import Piece from './Piece';
import { SHAPES, Shape } from './Shape';
import ShapeQueue from './ShapeQueue';

const MIN_ROWS = 5;
const MIN_COLS = 5;
const MAX_ROWS = 100;
const MAX_COLS = 100;

export default class BlockyState {
	/** Default options for the game.*/
	static get DEFAULT_OPTIONS() {
		return Object.freeze({
			level: 0,
			useGravity: true,
			rows: 20,
			cols: 10,
			entryCoord: new Coord(1, 4).freeze(),
			height: 0,
			linesPerLevel: 10
		});
	}

	/**
	 * Returns some default options for the game.
	 */
	static defaultOptions() {
		return { ...BlockyState.DEFAULT_OPTIONS };
	}

	static get MIN_ROWS() { return MIN_ROWS; }
	static get MIN_COLS() { return MIN_COLS; }
	static get MAX_ROWS() { return MAX_ROWS; }
	static get MAX_COLS() { return MAX_COLS; }

  /**
	 * Calculates the column where pieces appear, which is the center column,
	 * or just left of center if there are an even number of columns.
	 * @param {number} cols Number of columns on the board.
	 */
	static calcEntryColumn(cols) {
		const _cols = bounded(
			validatePositiveInteger(cols, 'cols'),
			BlockyState.MIN_COLS,
			BlockyState.MAX_COLS
		);

		return Math.floor(_cols / 2) - ((_cols % 2 === 0) ? 1 : 0);
	}

	/**
	 * Creates a new BlockyState with the same values as the given BlockyState.
	 * @param {BlockyState} other The BlockyState to copy.
	 * @return {BlockyState} A new BlockyState with the same values as the given Blocky
	 */
	static copy(other) {
    const copy = new BlockyState(other._options);

		copy._board = other._board.slice();
		copy._isGameOver = other.isGameOver;
		copy._isPaused = other.isPaused;
		copy._isClearingLines = other.isClearingLines;
		copy._hasStarted = other.hasStarted;
		copy._level = other.level;
		copy._score = other.score;
		copy._linesCleared = other.linesCleared;
		copy._numPiecesDropped = other.numPiecesDropped;
		copy._linesUntilNextLevel = other.linesUntilNextLevel;
		copy._dist = other._dist.slice();
		copy._nextShapes = ShapeQueue.copy(other._nextShapes);
		copy._piece = Piece.copy(other._piece);

    return copy;
	}

  // protected _rows = BlockyState.DEFAULT_OPTIONS.rows;
  // protected _cols = BlockyState.DEFAULT_OPTIONS.cols;
  // protected _entryCoord: Coord = BlockyState.DEFAULT_OPTIONS.entryCoord;
	// protected _linesPerLevel | ((level) => number) = BlockyState.DEFAULT_OPTIONS.linesPerLevel;
  // protected _board = [];
  // protected _isGameOver: boolean = false;
  // protected _isPaused: boolean = false;
  // protected _isClearingLines: boolean = false;
  // protected _hasStarted: boolean = false;
  // protected _level = 0;
  // protected _score = 0;
  // protected _linesCleared = 0;
  // protected _numPiecesDropped = 0;
  // protected _linesUntilNextLevel = 0;
  // protected _dist = [];
  // protected _nextShapes: ShapeQueue = new ShapeQueue();
  // protected _piece: Piece = new Piece(
	// 	new Position(this._entryCoord, 0, this._nextShapes.peek().numRotations),
	// 	this._nextShapes.poll()
	// );
	// protected _options: GameOptions;

  // TODO private pointsPerLineClear | ((linesCleared, level) => number);
  // TODO create function to calculate points per line cleared based property

	/**
	 * Creates a new BlockyState with the given number of rows and columns.
	 *
	 * @param options The options for the game.
	 */
	constructor(options) {
		this._options = Object.seal(
			Object.assign(BlockyState.defaultOptions(), options)
		);

		/** @type {number} */
		this._rows = BlockyState.DEFAULT_OPTIONS.rows;
		/** @type {number} */
		this._cols = BlockyState.DEFAULT_OPTIONS.cols;
		/** @type {Coord} */
		this._entryCoord = BlockyState.DEFAULT_OPTIONS.entryCoord;
		/** @type {number | ((level: number) => number)} */
		this._linesPerLevel = BlockyState.DEFAULT_OPTIONS.linesPerLevel;
		/** @type {number[]} */
		this._board = [];
		this._isGameOver = false;
		this._isPaused = false;
		this._isClearingLines = false;
		this._hasStarted = false;
		this._level = 0;
		this._score = 0;
		this._linesCleared = 0;
		this._numPiecesDropped = 0;
		this._linesUntilNextLevel = 0;
		/**
		 * TODO NYI
		 * @type {number[]}
		 */
		this._dist = [];
		this._nextShapes = new ShapeQueue();
		this._piece = new Piece(
			new Position(this._entryCoord, 0, this._nextShapes.peek().numRotations),
			this._nextShapes.poll()
		);

		this.reset();
	}

	/**
	 * Resets the state of the game. This should only be called when the game is
	 * not in progress.
	 * The board can be optionally resized. If resizing, provide a new entryCoord.
	 * This will clear the board, reset the score, level, and all other stats.
	 *
	 * @param options The options for the game.
	 */
	reset(options) {
		if (this.isRunning()) {
			console.warn('Reseting game while it is in progress.');
		}

		this._options = Object.seal(Object.assign({}, this._options, options));

		this._rows = validatePositiveInteger(this._options.rows, 'rows');
		this._cols = validatePositiveInteger(this._options.cols, 'cols');
		this._entryCoord = this._options.entryCoord.freeze();
		this._linesPerLevel = this._options.linesPerLevel;
		this._board = Array(this._rows * this._cols).fill(0);
		this._isGameOver = false;
		this._isPaused = false;
		this._isClearingLines = false;
		this._hasStarted = false;
		this._level = this._options.level;
		this._score = 0;
		this._linesCleared = 0;
		this._numPiecesDropped = 0;
		this._linesUntilNextLevel = this.getLinesPerLevel();
		this._dist = Array(SHAPES.length).fill(0);
		this._nextShapes = new ShapeQueue();
		this._piece = new Piece(
			new Position(this._entryCoord, 0, this._nextShapes.peek().numRotations),
			this._nextShapes.poll()
		);

		// TODO if height is provided, populate the board with blocks accordingly
		// if (options?.height) {
		//
		// }
	}

	get rows() { return this._rows; }
	get cols() { return this._cols; }
	get entryCoord() { return this._entryCoord; }
	get linesPerLevel() { return this._linesPerLevel; }
  /** Returns a copy of the board. */
  get board() { return this._board.slice(); }
  get isGameOver() { return this._isGameOver; }
  get isPaused() { return this._isPaused; }
  get isClearingLines() { return this._isClearingLines; }
  get hasStarted() { return this._hasStarted; }
  get level() { return this._level; }
  get score() { return this._score; }
  get linesCleared() { return this._linesCleared; }
  get numPiecesDropped() { return this._numPiecesDropped; }
  get linesUntilNextLevel() { return this._linesUntilNextLevel; }
  get dist() { return this._dist.slice(); }
  get nextShapes() { return ShapeQueue.copy(this._nextShapes); }
  /** Returns the current piece. */
  get piece() { return this._piece; }
	get options() { return Object.freeze({ ...this._options }); }

  set linesCleared(linesCleared) { this._linesCleared = linesCleared; }
  set score(score) { this._score = score; }
  set isClearingLines(isClearingLines) { this._isClearingLines = isClearingLines; }
  set linesUntilNextLevel(linesUntilNextLevel) { this._linesUntilNextLevel = linesUntilNextLevel; }
  set level(level) { this._level = level; }
  set hasStarted(hasStarted) { this._hasStarted = hasStarted; }
  set isGameOver(isGameOver) { this._isGameOver = isGameOver; }
  set isPaused(isPaused) { this._isPaused = isPaused; }

	/**
	 * @returns {number}
	 */
  getLinesPerLevel() {
    return (typeof this._linesPerLevel === 'function') ?
      this._linesPerLevel(this.level) :
      this._linesPerLevel;
  }

	/** Gets the next shape in the queue.*/
	getNextShape() {
		return this._nextShapes.peek();
	}

	/**
	 * Peeks the given number of shapes in the queue.
	 * @param {number} numShapes Number of shapes to peek.
	 * @return {Shape[]} An array of the next shapes in the queue.
	 */
	getNextShapes(numShapes) {
		return this._nextShapes.peekNext(numShapes);
	}

	/**
	 * Sets the value of the cell at the given index.
	 * @param {number} index The index of the cell to set.
	 * @param {number} value The value to set the cell to.
	 * @throws Error if the given index is out of bounds.
	 */
	setCellByIndex(index, value) {
		if (index < 0 || index >= this._board.length) {
			throw new Error(`Index ${index} is out of bounds`);
		}

		this._board[index] = value;
	}

	/**
	 * Sets the value of the cell at the given location.
	 * @param {Coord} location The location of the cell to set.
	 * @param {number} value The value to set the cell to.
	 * @throws Error if the given location is out of bounds.
	 */
	setCell(location, value) {
		if (!this.isLocationValid(location)) {
			throw new Error(`Location ${location.toString()} is out of bounds`);
		}

    this._board[location.row * this._cols + location.col] = value;
	}

	/**
	 * Gets the value of the cell at the given index.
	 * @param {number} index The index of the cell to get.
	 * @return {number} The value of the cell at the given index.
	 * @throws Error if the given index is out of bounds.
	 */
	getCellByIndex(index) {
		if (index < 0 || index >= this._board.length) {
			throw new Error(`Index ${index} is out of bounds`);
		}

		return this._board[index];
	}

	/**
	 * Gets the value of the cell at the given location.
	 * @param {Coord} location The location of the cell to get.
	 * @return {number} The value of the cell at the given location.
	 * @throws Error if the given location is out of bounds.
	 */
	getCell(location) {
		if (!this.isLocationValid(location)) {
			throw new Error(`Location ${location.toString()} is out of bounds`);
		}

    return this._board[location.row * this._cols + location.col];
	}

	/**
	 * Checks whether the specified cell is empty.
	 * @param {Coord} location The location of the cell to check.
	 * @return {boolean} True if the cell is empty; false otherwise.
	 * @throws Error if the given location is out of bounds.
	 */
	isCellEmpty(location) {
		return this.getCell(location) === 0;
	}

	/**
	 * Checks whether the given coordinates are within the bounds of the board.
	 * @param {Coord} location The coordinates to check.
	 * @return {boolean} True if the coordinates are valid; false otherwise.
	 */
	isLocationValid(location) {
		return (
			location.row >= 0 &&
			location.row < this._rows &&
			location.col >= 0 &&
			location.col < this._cols
		);
	}

	/**
	 * Checks whether the current piece is within the bounds of the board.
	 * @return {boolean} True if the piece is in bounds; false otherwise.
	 */
	isCurrentPieceLocationValid() {
    return this.isPositionValid(this._piece.position);
	}

	/**
	 * Checks whether the given position for the current shape is valid,
	 * i.e. the piece blocks are all within the bounds of the board, there
	 * are no blocks in the way, and the piece is not wrapping around the board.
	 *
	 * @param {Position} pos The position to check.
	 * @return {boolean} True if the position is valid; false otherwise.
	 */
	isPositionValid(position) {
		const newBlockCoords = this.getShapeCoordsAtPosition(position);
		let minCol = newBlockCoords[0].col;
		let maxCol = newBlockCoords[0].col;

		for (let c of newBlockCoords) {
			minCol = Math.min(minCol, c.col);
			maxCol = Math.max(maxCol, c.col);

			if (
				!this.isLocationValid(c) ||
				!this.isCellEmpty(c) ||

				// TODO May not be necessary anymore when using Coord
				// TODO because cols will just be negative instead of wrapping around.
				// A large gap between cell columns means the piece wrapped around the board.
				(maxCol - minCol) > 4
			) {
				return false;
			}
		}

		return true;
	}

	/**
	 * ! it's more like validation of the resulting location and does not imply that a path exists to it unless the
	 * ! magnitude of the move is (exclusively) one unit of rotation or of offset.
	 * ! however you wanna fit that into a name... is great
	 * Checks that the given move is in bounds of the board, that there are no blocks occupying
	 * the spaces, and that the resulting position does not end up higher on the board.
	 *
	 * @param {Move} move
	 * @return {boolean} True if the active piece can move to the specified position; otherwise false.
	 */
	canPieceMove(move) {
		// TODO game should also have to be started
		return (
			!this.isGameOver &&
			this.piece.isActive &&
			!this.isPaused &&
			move.row >= 0 &&
			this.isPositionValid(this.piece.position.add(move))
		);
	}

	/**
	 * Checks whether the current piece can move with the given rotation.
	 * If the piece cannot be rotated in place, it will check whether it can be shifted first.
	 *
	 * If shifting doesn't allow rotation, then this returns an adjusted move of STAND, indicating
	 * the rotation is not possible.
	 *
	 * @param {Move} move CLOCKWISE or COUNTERCLOCKWISE
	 * @return {Move} A Move representing the rotation, it may be adjusted to include a left
	 * or right shift that is required to accomodate the rotation.
	 * If the rotation is not possible, returns Move.STAND.
	 */
	tryRotation(move) {
		if (!(move.equals(Move.CLOCKWISE) || move.equals(Move.COUNTERCLOCKWISE))) {
			return Move.copy(Move.STAND);
		}

		if (this.canPieceMove(move)) {
			return Move.copy(move);
		}

		// Attempt to "kick off" an edge or block if rotating too close.
		const kickLeft = Move.copy(move);
		const kickRight = Move.copy(move);
		for (let colOffset = 1; colOffset < 3; colOffset++) {
			if (this.canPieceMove(kickLeft.add(Move.LEFT))) {
				return kickLeft;
			}

			if (this.canPieceMove(kickRight.add(Move.RIGHT))) {
				return kickRight;
			}
		}

		return Move.copy(Move.STAND);
	}

	/**
	 * Calculates the block coordinates for the active shape at the given position.
	 * @param {Position} pos Position of the shape to calculate the block coordinates for.
	 * @return {Coord[]} An array of coordinates for the blocks of the shape at the given position.
	 */
	getShapeCoordsAtPosition(position) {
		return new Piece(position, this.piece.shape).blockCoords;
	}

	/**
	 * Determines whether the given row is full.
	 * @param {number} row Index of the row to check.
	 * @return {boolean} True if the row is full; false otherwise.
	 */
	isRowFull(row) {
		for (let col = 0; col < this._cols; col++) {
			// TODO get rid of wasteful instantiations
			if (this.isCellEmpty(new Coord(row, col))) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Gets a list of indices for rows that are full, in ascending order.
	 * @returns {number[]}
	 */
	getFullRows() {
		/** @type {number[]} */
		const lines = [];

		for (let row = 0; row < this._rows; row++) {
			if (this.isRowFull(row)) {
				lines.push(row);
			}
		}

		return lines;
	}

	/**
	 * Copies the one row's values to another.
	 *
	 * @param {number} fromRow The row to copy from.
	 * @param {number} toRow The row to copy to.
	 * @throws Error if either row index is out of bounds.
	 */
	copyRow(fromRow, toRow) {
		// Validate row indices
		if (fromRow < 0 || fromRow >= this._rows) {
			throw new Error(`fromRow ${fromRow} is out of bounds`);
		}

		if (toRow < 0 || toRow >= this._rows) {
			throw new Error(`toRow ${toRow} is out of bounds`);
		}

		const fromRowStart = fromRow * this._cols;
		const toRowStart = toRow * this._cols;

		for (let col = 0; col < this._cols; col++) {
			this._board[toRowStart + col] = this._board[fromRowStart + col];
		}
	}

	/**
	 * Clears the given row.
	 * @param {number} row The row to clear.
	 * @throws Error if the row index is out of bounds.
	 */
	clearRow(row) {
		// Validate row index
		if (row < 0 || row >= this._rows) {
			throw new Error(`Row ${row} is out of bounds`);
		}

		for (let col = 0; col < this._cols; col++) {
			this._board[row * this._cols + col] = 0;
		}
	}

	/**
	 * Determines whether the given row is empty.
	 * @param {number} row The row to check.
	 * @returns {boolean} True if the row is empty; otherwise false.
	 * @throws Error if the row index is out of bounds.
	 */
	isRowEmpty(row) {
		// Validate row index
		if (row < 0 || row >= this._rows) {
			throw new Error(`Row ${row} is out of bounds`);
		}

		for (let i = row * this._cols; i < (row + 1) * this._cols; i++) {
			if (this._board[i] > 0) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Determines if the piece is sharing the same cell as any other block.
	 * @return {boolean} True if the piece is overlapping with other blocks; otherwise false.
	 */
	pieceOverlapsBlocks() {
		return this.piece.isActive && this.piece.intersects(this);
	}

	/**
	 * Places the piece on the board at its current position.
	 */
	placePiece() {
		if (this.piece.isActive) {
      this.piece.blockCoords.forEach((coord) => this.setCell(coord, this.piece.shape.value));
			this.piece.disable();
			this._numPiecesDropped++;
		}
	}

	/**
	 * Resets the piece to the top of the board with the next shape from the queue.
	 */
	resetPiece() {
		this.piece.reset(this._entryCoord, this._nextShapes.poll());
	}

	/**
	 * Fast-forwards the shape queue so that the given shape is next in the queue.
	 * @param {Shape} shape The Shape that will be next in the queue.
	 */
	setNextShape(shape) {
		// Fast-forward so that the given shape is next in the queue.
		while (this._nextShapes.peek().value != shape.value) {
			this._nextShapes.poll();
		}
	}

	/**
	 * Returns whether the game has started and is in progress.
	 * TODO determine whether this should also take into account pausing
	 */
	isRunning()  {
		return this.hasStarted && !this.isGameOver;
	}
}
