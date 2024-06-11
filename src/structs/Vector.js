import Freezable from '../util/Freezable';

export default class Vector extends Freezable {
  /**
   * @param {object} coord
   * @param {number} coord.x The x coordinate of the vector.
   * @param {number} coord.y The y coordinate of the vector.
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
   *
   * @param {Vector} other
   * @returns {Vector} This vector for chaining.
   */
  add(other) {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  /**
   *
   * @param {Vector} other
   * @returns {Vector} This vector for chaining.
   */
  sub(other) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  /**
   *
   * @param {number} scalar
   * @returns {Vector} This vector for chaining.
   */
  mul(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
   * @param {number} scalar
   * @returns {Vector} This vector for chaining.
   */
  div(scalar) {
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }

  /**
   * @param {Vector} other
   * @returns {number} The dot product of this vector and the other.
   */
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }

  /**
   *
   * @param {Vector} other
   * @returns {number} The cross product of this vector and the other.
   */
  cross(other) {
    return this.x * other.y - this.y * other.x;
  }

  /**
   * @returns {number} The magnitude of this vector.
   */
  mag() {
    return Math.sqrt(this.x**2 + this.y**2);
  }

  /**
   * @returns {Vector} This vector (for chaining) divided by its magnitude.
   */
  unit() {
    return this.div(this.mag());
  }

  /**
   * @returns {number} The direction of this vector in radians.
   */
  angle() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * @returns {number} The direction of this vector in degrees.
   */
  angleDeg() {
    return this.angle() * 180 / Math.PI;
  }

  /**
   * Rotates this vector by the given angle.
   * @param {number} angle The angle to rotate by in radians.
   * @returns {Vector} This vector for chaining.
   */
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.x = this.x * cos - this.y * sin;
    this.y = this.y * cos + this.x * sin;
    return this;
  }

  /**
   * @returns {string} A string representation of this vector in the form <x, y>.
   */
  toString() {
    return `<${this.x}, ${this.y}>`;
  }

  /**
   * @param {Vector} other
   * @returns {boolean} Whether this vector is equal to the other.
   */
  equals(other) {
    return this.x === other.x && this.y === other.y;
  }
}
