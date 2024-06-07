import { Shape } from './Shape';
import BlockyState from './BlockyState';
import Position from '../structs/Position';
import Coord from '../structs/Coord';
import Move from '../structs/Move';
import ZMod from '../util/ZMod';

export default class Piece {
  /**
   * Copies of the given piece.
   *
   * @param {Piece} other The piece to copy.
   * @returns {Piece} A copy of the given piece.
   */
  static copy(other) {
    const copy = new Piece(other.position, other.shape);
    copy._position = Position.copy(other.position);
    copy._isActive = other.isActive;
    copy._blockCoords = other.blockCoords;
    return copy;
  }

  /**
   * Creates a new piece with the given location and shape.
   *
   * @param {Position} location The location of the piece.
   * @param {Shape} shape The shape of the piece.
   */
  constructor(location, shape) {
    this._shape = shape;
    this._position = Position.copy(location);
    this._position.maxRotation = shape.numRotations;
    this._isActive = true;
    this._blockCoords = Array(4).fill(null).map(() => new Coord(0, 0));
    this._updateBlockCoords();
  }

  /**
   * Resets the piece to the given location and shape.
   * @param {Coord} location The location to reset the piece to.
   * @param {Shape} shape The shape to reset the piece to.
   */
  reset(location, shape) {
    this._isActive = true;
    this._position.set(location);
    this.shape = shape;
  }

  get shape() {
    return this._shape;
  }

  /**
   * Sets the shape of the piece and updates the block coordinates.
   * The rotation will be reset to the default state for the shape.
   * @param {Shape} shape The new shape of the piece.
   */
  set shape(shape) {
    this._shape = shape;
    this._position.rotation = 0;
    this._position.maxRotation = shape.numRotations;
    this._updateBlockCoords();
  }

  get position() {
    return Position.copy(this._position);
  }

  set position(position) {
    this._position.reset(position);
    this._updateBlockCoords();
  }

  get isActive() {
    return this._isActive;
  }

  /** Sets the piece as inactive.*/
  disable() {
    this._isActive = false;
  }

  /** Sets the piece as active.*/
  enable() {
    this._isActive = true;
  }

  /** Gets a copy of the block coordinates of the piece.*/
  get blockCoords() {
    return Coord.copyAll(this._blockCoords);
  }

  /**
   * Moves the piece by the given offset and rotation, then updates the block coordinates.
   * Legality of the move is not checked.
   * @param {Move} move The move to apply to the piece position.
   */
  move(move) {
    this._position.add(move);
    this._updateBlockCoords();
  }

  /**
   * Returns whether or not the piece intersects with any blocks on the given state.
   * @param {BlockyState} state The state to check for intersections.
   * @return {boolean} Whether or not the piece intersects with any blocks on the given state.
   */
  intersects(state) {
    return this._blockCoords.some(coord => !state.isCellEmpty(coord));
  }

  /**
   * Updates the block coordinates based on the current position and shape.
   * This method is called automatically when the position or shape is changed.
   */
  _updateBlockCoords() {
    const rotationIndex = ZMod.apply(this._position.rotation, this._shape.numRotations);

    for (let i = 0; i < this._blockCoords.length; i++) {
      this._blockCoords[i].reset(this._position.offset);
      this._blockCoords[i].add(this._shape.getRotation(rotationIndex)[i]);
    }
  }
}
