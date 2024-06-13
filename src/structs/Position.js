import Coord from './Coord.js';
import Move from './Move.js';
import { validatePositiveInteger } from '../util/common.js';
import ZMod from '../util/ZMod.js';

export default class Position extends Move {
  /**
   * Returns a new Position with the same row, col, rotation, and maxRotation as the given Position.
   * @param position The Position to copy.
   * @returns {Position} A deep copy of this position.
   */
  static copy(position) {
    return new Position(position, position.rotation, position._maxRotation);
  }

  /**
   * Creates a new Position with the given offset, rotation, and maxRotation.
   * Rotation will be normalized to be within the maximum.
   * Max rotation must be a positive integer.
   * @param {Coord} location The location of this Position.
   * @param {number} rotation The rotation value of this Position.
   * @param {number} maxRotation The maximum rotation value of this Position.
   */
  constructor(location, rotation, maxRotation) {
    super(location, rotation);
    this._maxRotation = validatePositiveInteger(maxRotation, 'maxRotation');
    this._normalizeRotation();
  }

  /**
   * Gets the location of this Position.
   */
  get location() {
    return this.offset;
  }

  /**
   * Gets the maximum rotation of this Position.
   */
  get maxRotation() {
    return this._maxRotation;
  }

  /**
   * Gets the rotation of this Position.
   */
  get rotation() {
    return super.rotation;
  }

  /**
   * Sets the location of this Position.
   * Rotation will be normalized to be within the maximum.
   * @param {number} rotation The new rotation value.
   * @throws {Error} If this Position is frozen.
   */
  set rotation(rotation) {
    super.rotation = rotation;
    this._normalizeRotation();
  }

  /**
   * Sets the maximum rotation of this Position.
   * Rotation will be normalized to be within the new maximum.
   * @param {number} maxRotation The new maximum rotation value.
   * @throws {Error} If this Position is frozen.
   */
  set maxRotation(maxRotation) {
    this.throwIfFrozen();
    this._maxRotation = validatePositiveInteger(maxRotation, 'maxRotation');
    this._normalizeRotation();
  }

  get row() {
    return this._offset.row;
  }

  set row(row) {
    this.throwIfFrozen();
    this._offset.row = row;
  }

  get col() {
    return this._offset.col;
  }

  set col(col) {
    this.throwIfFrozen();
    this._offset.col = col;
  }

  /**
   * Sets the location of this Position.
   * Rotation will be normalized to be within the maximum.
   * @param {Coord} location The new location.
   * @throws {Error} If this Position is frozen.
   */
  set location(location) {
    this.throwIfFrozen();
    this._offset.reset(location);
    this._normalizeRotation();
  }

  /**
   * Adds the given Move to this Position.
   * Rotation will be normalized to be within the maximum.
   * @param {Move} other The Move to add.
   * @returns {Position} This Position.
   * @throws {Error} If this Position is frozen
   */
  add(other) {
    super.add(other);
    this._normalizeRotation();
    return this;
  }

  /**
   * Resets the coordinates to the ones specified.
   * @param {Move} other
   * @returns {Position} This Position.
   */
  reset(other) {
    super.set(other.offset, other.rotation);
    this._normalizeRotation();
    return this;
  }

  /**
   * Adds the given offset to this Position.
   * Rotation will be normalized to be within the maximum.
   * @param {number} rotation The rotation to add.
   * @returns {Position} This Position.
   * @throws {Error} If this Position is frozen.
   */
  rotate(rotation) {
    super.rotate(rotation);
    this._normalizeRotation();
    return this;
  }

  /**
   * Rotates this Position clockwise.
   * Rotation will be normalized to be within the maximum.
   * @returns {Position} This Position.
   * @throws {Error} If this Position is frozen.
   */
  rotateClockwise() {
    super.rotateClockwise();
    this._normalizeRotation();
    return this;
  }

  /**
   * Rotates this Position counter-clockwise.
   * Rotation will be normalized to be within the maximum.
   * @returns {Position} This Position.
   * @throws {Error} If this Position is frozen.
   */
  rotateCounterClockwise() {
    super.rotateCounterClockwise();
    this._normalizeRotation();
    return this;
  }

  /**
   * Gets whether this Position is equal to the given Position.
   * @param {Position} other The Position to compare to.
   * @returns {boolean} True if this Position is equal to the given Position; false otherwise.
   */
  equals(other) {
    return (
      this.offset.equals(other.offset) &&
      this.rotation === other.rotation &&
      this._maxRotation === other._maxRotation
    );
	}

  /**
   * @returns {number} A hash code for this Position.
   */
	hashCode() {
		return super.hashCode() * 37 + this._maxRotation;
	}

  /**
   * @returns {string} A string representation of this Position.
   */
	toString() {
    return `Position{offset: ${this._offset.toString()}, rotation: ${this._rotation}, maxRotation: ${this._maxRotation}}`;
	}

  _normalizeRotation() {
    this._rotation = ZMod.apply(this._rotation, this._maxRotation);
  }
}
