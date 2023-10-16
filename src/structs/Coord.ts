import Freezable from "../util/Freezable";

/**
 * Contains row, column coordinates.
 */
export default class Coord extends Freezable {
  static readonly ZERO = new Coord(0, 0).freeze();
  static readonly UP = new Coord(-1, 0).freeze();
  static readonly DOWN = new Coord(1, 0).freeze();
  static readonly LEFT = new Coord(0, -1).freeze();
  static readonly RIGHT = new Coord(0, 1).freeze();

	/**
	 * Returns a new Coord with the same row and col as the given Coord.
	 *
	 * @param other The Coord to copy.
	 */
	static copy(other: { row: number, col: number }): Coord {
		return new Coord(other.row, other.col);
	}

	/**
	 * Creates a deep copy of the given array.
	 */
	static copyAll(source: Coord[]): Coord[] {
    return source.map(coord => Coord.copy(coord));
	}

	/**
	 * Adds the given offset to all Coords in the array.
	 */
	static offsetAll(coords: Coord[], offset: Coord): Coord[] {
		coords.forEach(coord => coord.addCoord(offset));
		return coords;
	}

	private _val: number[];

	/**
	 * Creates a new Coord with the given row and column coordinates.
	 */
	constructor(row: number, col: number) {
		super();
		this._val = [ row, col ];
	}

	freeze(): Coord {
		return super.freeze() as Coord;
	}

	unfreeze(): Freezable {
		throw new Error("Operation not supported.");
	}

	/**
	 * Gets the row coordinate.
	 */
	get row() {
		return this._val[0];
	}

	/**
	 * Gets the column coordinate.
	 */
	get col() {
		return this._val[1];
	}

	/**
	 * Sets the row and column coordinates.
	 */
	set row(row: number) {
		this.throwIfFrozen();
		this._val[0] = row;
	}

	/**
	 * Sets the column coordinate.
	 */
	set col(col: number) {
		this.throwIfFrozen();
		this._val[1] = col;
	}

	/**
	 * Sets the coordinates to the ones specified.
	 *
	 * @param location The new coordinates.
	 */
	reset(location: { row: number, col: number }): Coord {
    this.throwIfFrozen();
		this._val = [ location.row, location.col ];
    return this;
	}

	/**
	 * Adds the given number of rows to this Coord.
	 *
	 * @param row Number of rows to add.
	 */
  addRow(row: number): Coord {
    this.throwIfFrozen();
		this._val[0] += row;
    return this;
  }

	/**
	 * Adds the given number of columns to this Coord.
	 *
	 * @param col Number of columns to add.
	 */
  addCol(col: number): Coord {
    this.throwIfFrozen();
    this._val[1] += col;
    return this;
  }

	/**
	 * Adds an arbitrary number of coordinates to this one.
	 *
	 * @param coords Other coords whose positions should be added to this one.
	 */
	addCoord(...coords: { row: number, col: number }[]): Coord {
    this.throwIfFrozen();
    for (let coord of coords) {
      this._val[0] += coord.row;
      this._val[1] += coord.col;
    }
    return this;
	}

	/**
	 * Add the given coordinates to this one.
	 *
	 * @param row Number of rows to add.
	 * @param col Number of columns to add.
	 */
	add(location: { row: number, col: number }): Coord {
    this.throwIfFrozen();
		this._val[0] += location.row;
		this._val[1] += location.col;
		return this;
	}

	/**
	 * Gets the square distance between these coordinates and another.
	 *
	 * @param other The other coordinates.
	 */
	sqrDist(other: Coord): number {
		const rowDiff = this.row - other.row;
		const colDiff = this.col - other.col;
		return rowDiff*rowDiff + colDiff*colDiff;
	}

	/**
	 * Gets whether these coordinates are equal to another.
	 *
	 * @param other The other coordinates.
	 */
	equals(other: Coord): boolean {
		return this.row === other.row && this.col === other.col;
	}

	hashCode(): number {
		return this.row * 31 + this.col;
	}

	/**
	 * Returns a string representation of this Coord.
	 */
	toString(): string {
		return `(${this.row},${this.col})`;
	}
}
