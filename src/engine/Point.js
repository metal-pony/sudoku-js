import Freezable from '../util/Freezable.js';
import { dist, EPSILON } from './Geo.js';

export default class Point extends Freezable {
  /**
   * Creates a new Point with the given x and y coordinates,
   * or (0,0) if the coordinates are omitted.
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   */
  constructor({ x = 0, y = 0 } = { x: 0, y: 0 }) {
    super();

    this._x = x;
    this._y = y;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  set x(x) {
    this.throwIfFrozen();
    this._x = x;
  }

  set y(y) {
    this.throwIfFrozen();
    this._y = y;
  }

  /**
   * Calculates the distance between this point and another.
   * @param {Point} other
   */
  dist(other) {
    return dist(this, other);
  };

  toString() {
    return `${this.isFrozen() ? '!' : ''}(${this.x},${this.y})`;
  }

  /**
   * Determines if this point is equal to another point within the given epsilon.
   * @param {Point} other
   * @param {number} epsilon
   * @returns {boolean}
   */
  equals(other, epsilon = EPSILON) {
    return Math.abs(this.x - other.x) < epsilon && Math.abs(this.y - other.y) < epsilon;
  }
}
