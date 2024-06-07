import Freezable from "../util/Freezable";

/**
 * Contains row, column coordinates.
 */
export default class Coord extends Freezable {
  static ZERO = new Coord(0, 0).freeze();
  static UP = new Coord(-1, 0).freeze();
  static DOWN = new Coord(1, 0).freeze();
  static LEFT = new Coord(0, -1).freeze();
  static RIGHT = new Coord(0, 1).freeze();

	/**
	 * Returns a new Coord with the same row and col as the given Coord.
	 * @param {Coord} other The Coord to copy.
	 * @returns {Coord} A new Coord with the same row and col as the given Coord.
	 * TODO rename replicateAll
	 */
	static copy(other) {
		return new Coord(other.row, other.col);
	}

	/**
	 * Creates a deep copy of the given array.
	 * @param {Coord[]} source The array to copy.
	 * @returns {Coord[]} A new array containing deep copies of the original.
	 * TODO rename replicateAll
	 */
	static copyAll(source) {
    return source.map(coord => Coord.copy(coord));
	}

	/**
	 * Adds the given offset to all Coords in the array.
	 * @param {Coord[]} coords The Coords to modify.
	 * @param {Coord} offset The offset to add.
	 * @returns {Coord[]} The provided Coords array.
	 */
	static offsetAll(coords, offset) {
		coords.forEach(coord => coord.addCoord(offset));
		return coords;
	}

	/**
	 * Creates a new Coord with the given row and column coordinates.
	 * @param {number} row The row coordinate.
	 * @param {number} col The column coordinate.
	 */
	constructor(row, col) {
		super();
		this._val = [ row, col ];
	}

	unfreeze() {
		throw new Error("Operation not supported.");
	}

	/**
	 * Gets the row coordinate.
	 * @returns {number} The row coordinate.
	 */
	get row() {
		return this._val[0];
	}

	/**
	 * Gets the column coordinate.
	 * @returns {number} The column coordinate.
	 */
	get col() {
		return this._val[1];
	}

	/**
	 * Sets the row and column coordinates.
	 * @param {number} row The row coordinate.
	 */
	set row(row) {
		this.throwIfFrozen();
		this._val[0] = row;
	}

	/**
	 * Sets the column coordinate.
	 * @param {number} col The column coordinate.
	 */
	set col(col) {
		this.throwIfFrozen();
		this._val[1] = col;
	}

	/**
	 * Sets the coordinates to the ones specified.
	 * @param {Coord} location The new coordinates.
	 * @returns {Coord} Itself for convenience.
	 */
	reset(location) {
    this.throwIfFrozen();
		this._val = [ location.row, location.col ];
    return this;
	}

	/**
	 * Adds the given number of rows to this Coord.
	 * @param {number} row Number of rows to add.
	 * @returns {Coord} Itself for convenience.
	 */
  addRow(row) {
    this.throwIfFrozen();
		this._val[0] += row;
    return this;
  }

	/**
	 * Adds the given number of columns to this Coord.
	 * @param {number} col Number of columns to add.
	 * @returns {Coord} Itself for convenience.
	 */
  addCol(col) {
    this.throwIfFrozen();
    this._val[1] += col;
    return this;
  }

	/**
	 * Adds an arbitrary number of coordinates to this one.
	 * @param {Coord[]} coords Other coords whose positions should be added to this one.
	 * @returns {Coord} Itself for convenience.
	 */
	addCoord(...coords) {
    this.throwIfFrozen();
    for (let coord of coords) {
      this._val[0] += coord.row;
      this._val[1] += coord.col;
    }
    return this;
	}

	/**
	 * Add the given coordinates to this one.
	 * @param {Coord} location The coordinates to add.
	 * @returns {Coord} Itself for convenience.
	 */
	add(location) {
    this.throwIfFrozen();
		this._val[0] += location.row;
		this._val[1] += location.col;
		return this;
	}

	/**
	 * Gets the square distance between these coordinates and another.
	 * @param {Coord} other The other coordinates.
	 * @returns {number} The square distance between these coordinates and another.
	 */
	sqrDist(other) {
		const rowDiff = this.row - other.row;
		const colDiff = this.col - other.col;
		return rowDiff*rowDiff + colDiff*colDiff;
	}

	/**
	 * Gets whether these coordinates are equal to another.
	 * @param {Coord} other The other coordinates to compare.
	 * @returns {boolean} Whether these coordinates have the same row and column values.
	 */
	equals(other) {
		return this.row === other.row && this.col === other.col;
	}

	/**
	 * Calculates a hash code for this Coord based on the row and column values.
	 * @returns {number} A hash code for this Coord.
	 */
	hashCode() {
		return this.row * 31 + this.col;
	}

	/**
	 * Returns a string representation of this Coord.
	 * @returns {string} A string representation of this Coord.
	 */
	toString() {
		return `(${this.row},${this.col})`;
	}
}
