import Coord from './Coord';
import Freezable from '../util/Freezable';

export default class Move extends Freezable {
  static get STAND() {return STAND; }
  static get UP() { return UP; }
  static get DOWN() { return DOWN; }
  static get LEFT() { return LEFT; }
  static get RIGHT() { return RIGHT; }
  static get CLOCKWISE() { return CLOCKWISE; }
  static get COUNTERCLOCKWISE() { return COUNTERCLOCKWISE; }
  static get ATOMIC_MOVES() { return ATOMIC_MOVES; }

  /**
   * Returns a new Move with the same row, col, and rotation as the given Move.
   * @param {Move} move The Move to copy.
   * @returns {Move} A deep copy of this Move.
   */
  static copy(move) {
    return new Move(move.offset, move.rotation);
  }

  /**
   * Creates a new Move with the given offset and rotation.
   * @param {Coord} location The location of this Move.
   * @param {number} rotation The rotation value of this Move.
   */
	constructor(location, rotation) {
    super();
		this._offset = Coord.copy(location);
		this._rotation = Number(rotation);
	}

  freeze() {
    this._offset.freeze();
    return super.freeze();
  }

  /** @throws {Error} Operation not supported.*/
	unfreeze() {
		throw new Error("Operation not supported.");
	}

  /**
   * Gets the offset of this Move.
   */
	get offset() {
		return this._offset;
	}

  /**
   * Gets the row of this Move.
   */
	get row() {
		return this._offset.row;
	}

  /**
   * Gets the column of this Move.
   */
	get col() {
		return this.offset.col;
	}

  /**
   * Gets the rotation of this Move.
   */
	get rotation() {
		return this._rotation;
	}

  /**
   * Sets the offset of this Move.
   * @param {Coord} offset The new offset.
   */
  set offset(offset) {
    this.throwIfFrozen();
    this._offset.reset(offset);
  }

  /**
   * Sets the row of this Move.
   * @param {number} row The new row value.
   */
  set row(row) {
    this.throwIfFrozen();
    this._offset.row = row;
  }

  /**
   * Sets the column of this Move.
   * @param {number} col The new column value
   */
  set col(col) {
    this.throwIfFrozen();
    this._offset.col = col;
  }

  /**
   * Sets the rotation of this Move.
   * @param {number} rotation The new rotation
   */
  set rotation(rotation) {
    this.throwIfFrozen();
    this._rotation = rotation;
  }

  /**
   * Sets the offset and rotation of this Move.
   * @param {Coord} offset The new offset.
   * @param {number} rotation The new rotation.
   * @returns {Move} This Move for convenience.
   */
  set(offset, rotation) {
    this.throwIfFrozen();

    if (offset) {
      this._offset.reset(offset);
    }

    if (rotation) {
      this._rotation = rotation;
    }

    return this;
  }

  /**
   * Shifts this Move by the given offset.
   * @param {Coord} offset The offset to shift by
   * @returns {Move} This Move for convenience.
   */
  shift(offset) {
    this.throwIfFrozen();
    this._offset.add(offset);
    return this;
  }

  /**
   * Adds the given Move to this Move.
   * @param {Coord} other The Move to add.
   * @returns {Move} This Move for convenience.
   */
  add(other) {
    this.throwIfFrozen();
    this._offset.add(other.offset);
    this._rotation += other.rotation;
    return this;
	}

  /**
   * Rotates this Move by the given amount.
   * @param rotation The amount to rotate by.
   * @returns {Move} This Move for convenience.
   */
  rotate(rotation) {
    this.throwIfFrozen();
    this._rotation += rotation;
    return this;
  }

  /**
   * Rotates this Move clockwise.
   * @returns {Move} This Move for convenience.
   */
	rotateClockwise() {
    return this.rotate(Move.CLOCKWISE.rotation);
	}

  /**
   * Rotates this Move counterclockwise.
   * @returns {Move} This Move for convenience
   */
	rotateCounterClockwise() {
    return this.rotate(Move.COUNTERCLOCKWISE.rotation);
	}

  /**
   * Returns the squared distance between this Move and the given Move.
   * @param other The Move to calculate the squared distance to.
   * @returns {number} The squared distance between this Move and the given Move.
   */
  sqrDist(other) {
    return this.offset.sqrDist(other.offset);
  }

  /**
   * Returns whether this Move is equal to the given Move.
   * @param {Move} other The other Move to compare to.
   * @returns {boolean} Whether this Move is equal to the given Move.
   */
	equals(other) {
    return this.offset.equals(other.offset) && this.rotation === other.rotation;
	}

  /**
   * @returns {number} The hash code for this Move.
   */
	hashCode() {
		return this._offset.hashCode() * 31 + this._rotation;
	}

  /**
   * Returns a string representation of this Move.
   * @returns {string} A string representation of this Move.
   */
	toString() {
    return `Move{offset: ${this._offset.toString()}, rotation: ${this._rotation}}`;
	}
}

const STAND = new Move(Coord.ZERO, 0).freeze();
const UP = new Move(Coord.UP, 0).freeze();
const DOWN = new Move(Coord.DOWN, 0).freeze();
const LEFT = new Move(Coord.LEFT, 0).freeze();
const RIGHT = new Move(Coord.RIGHT, 0).freeze();
const CLOCKWISE = new Move(Coord.ZERO, -1).freeze();
const COUNTERCLOCKWISE = new Move(Coord.ZERO, 1).freeze();
/** @type {Move[]} */
const ATOMIC_MOVES = Object.freeze([DOWN, LEFT, RIGHT, CLOCKWISE, COUNTERCLOCKWISE]);
