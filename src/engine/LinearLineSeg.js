import Point from './Point.js';
import { EPSILON } from './Geo.js';
import LineSeg from './LineSeg.js';

const TYPE = 'linear';

export default class LinearLineSeg extends LineSeg {
  static get TYPE() { return TYPE; }

  /**
   *
   * @param {Point[]} points
   * @throws {Error} if points.length < 2
   */
  constructor(points) {
    super(points);

    this._m = 0;
    this._b = 0;
    this._memo();
  }

  get type() {
    return LinearLineSeg.TYPE;
  }

  get p1() {
    return super.p1;
  }

  set p1(p1) {
    super.p1 = p1;
    this._memo();
  }

  get p2() {
    return super.p2;
  }

  set p2(p2) {
    super.p2 = p2;
    this._memo();
  }

  get m() {
    return this._m;
  }

  get b() {
    return this._b;
  }

  /**
   * Calculates and caches the slope and y-intercept of the line.
   */
  _memo() {
    if (!this.p1 || !this.p2) {
      return;
    }

    super._memo();

    this._m = (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x);
    this._b = this.p1.y - this._m * this.p1.x;

    if (!this.hasSlope()) {
      this._m = Infinity;
      this._b = Infinity;
    }
  }

  /**
   * @returns {boolean} True if this LinearLineSeg has a slope; otherwise false.
   */
  hasSlope() {
    return Math.abs(this._m) !== Infinity;
  }

  /**
   * @returns {boolean} True if this LinearLineSeg has a y-intercept; otherwise false.
   */
  hasYIntercept() {
    return Math.abs(this._b) !== Infinity;
  }

  /**
   *
   * @param {LinearLineSeg} other The other LinearLineSeg to compare.
   * Must be an instance of LinearLineSeg.
   * @param {number} epsilon
   * @returns {boolean} True if this LinearLineSeg is parallel to the other; otherwise false..
   */
  isParallel(other, epsilon = EPSILON) {
    if (other instanceof LinearLineSeg) {
      return Math.abs(this.m - other.m) < epsilon;
    }

    return false;
  }

  calcLength() {
    return Math.sqrt((this.p2.x - this.p1.x)**2 + (this.p2.y - this.p1.y)**2);
  }

  calcY(x) {
    return this.m * x + this.b;
  }

  calcX(y) {
    return (y - this.b) / this.m;
  }

  /**
   * Determines whether this LinearLineSeg contains the given point.
   * @param {Point} pt
   * @param {number} epsilon
   * @returns {boolean}
   */
  containsPoint(pt, epsilon = EPSILON) {
    const xMin = Math.min(this.p1.x, this.p2.x);
    const xMax = Math.max(this.p1.x, this.p2.x);
    const yMin = Math.min(this.p1.y, this.p2.y);
    const yMax = Math.max(this.p1.y, this.p2.y);
    const isWithinXBounds = xMin - epsilon <= pt.x && pt.x <= xMax + epsilon;
    const isWithinYBounds = yMin - epsilon <= pt.y && pt.y <= yMax + epsilon;
    const expectedPy = this.m * pt.x + this.b;

    return (
      isWithinXBounds &&
      isWithinYBounds &&
      (this.hasSlope() ? Math.abs(expectedPy - pt.y) <= epsilon : true)
    );
  };

  /**
   * @returns {string}
   */
  toString() {
    return `${this.isFrozen() ? '!' : ''}LinearLineSeg{${this.p1}, ${this.p2}}`;
  }

  /**
   * Determines whether this LinearLineSeg is equal to another.
   * @param {LinearLineSeg} other
   * @param {number} epsilon
   * @returns {boolean}
   */
  equals(other, epsilon = EPSILON) {
    return (
      super.equals(other) &&
      Math.abs(this.m - other.m) < epsilon &&
      Math.abs(this.b - other.b) < epsilon
    );
  }
}
