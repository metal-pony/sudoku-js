import Freezable from '../util/Freezable.js';
import { EPSILON } from './Geo.js';

export default class Point extends Freezable {
  /**
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   */
  constructor({ x, y }) {
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
   * @returns {number}
   */
  dist(other) {
    return Math.sqrt((other.x - this.x)**2 + (other.y - this.y)**2)
  };

  /**
   * @returns {string}
   */
  toString() {
    return `${this.isFrozen() ? '!' : ''}(${this.x}, ${this.y})`;
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
