import { Freezable } from "../util";
import { EPSILON } from "./Geo";
import { intersects } from "./IntersectionMap";
import Point from "./Point";

const MIN_POINTS = 2;
const INVALID_POINTS_ERR_MSG = `A Line segment must have exactly ${MIN_POINTS} points`;

export default class LineSeg extends Freezable {
  static get MIN_POINTS() { return MIN_POINTS; }
  static get INVALID_POINTS_ERR_MSG() { return INVALID_POINTS_ERR_MSG; }

  /**
   * @param {Point[]} points
   * @throws {Error} if points.length < 2
   */
  constructor(points) {
    super();

    if (points.length !== LineSeg.MIN_POINTS) {
      throw new Error(`${LineSeg.INVALID_POINTS_ERR_MSG}, got ${points.length}`);
    }

    this._points = points;
    this._angle = 0;
    this._angleDeg = 0;
    this._length = 0;
    this._memo();
  }

  /**
   * Calculates and caches the current angle, angle in degrees, and length of the line segment.
   */
  _memo() {
    this._angle = Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
    this._angleDeg = this._angle * 180 / Math.PI;
    this._length = this.calcLength();
  }

  // abstract get type(): string;

  get p1() {
    return this._points[0];
  }

  set p1(p1) {
    this.throwIfFrozen();
    this._points[0] = p1;
    this._memo();
  }

  get p2() {
    return this._points[1];
  }

  set p2(p2) {
    this.throwIfFrozen();
    this._points[1] = p2;
    this._memo();
  }

  get length() {
    return this._length;
  }

  get angle() {
    return this._angle;
  }

  get angleDeg() {
    return this._angleDeg;
  }

  move(x, y) {
    this.throwIfFrozen();

    this.p1.x += x;
    this.p1.y += y;
    this.p2.x += x;
    this.p2.y += y;

    this._memo();
  }

  /**
   * Calculates the length of the line segment.
   * @returns {number}
   */
  calcLength() {
    throw new Error('calcLength must be implemented by subclasses');
  }

  /**
   * Calculates the x value at a given y value.
   * @param {number} y
   * @returns {number}
   */
  calcX(y) {
    throw new Error('calcX must be implemented by subclasses');
  }

  /**
   * Calculates the y value at a given x value.
   * @param {number} x
   * @returns {number}
   */
  calcY(x) {
    throw new Error('calcY must be implemented by subclasses');
  }

  /**
   * Returns true if the line segment is parallel to another line segment.
   * @param {LineSeg} other
   * @returns {boolean}
   */
  isParallel(other) {
    throw new Error('isParallel must be implemented by subclasses');
  }

  /**
   *
   * @param {Point} p
   * @returns {boolean}
   */
  containsPoint(p) {
    throw new Error('containsPoint must be implemented by subclasses');
  }

  /**
   *
   * @param {LineSeg} other
   * @param {number} epsilon
   * @returns {boolean}
   */
  intersects(other, epsilon = EPSILON) {
    return intersects(this, other, epsilon);
  }

  freeze() {
    this.p1.freeze();
    this.p2.freeze();

    return super.freeze();
  }

  /**
   * @returns {string}
   */
  toString() {
    return `${this.isFrozen() ? '!' : ''}LineSeg[${this.p1.toString()}, ${this.p2.toString()}]`;
  }

  /**
   * @param {LineSeg} other
   * @returns {boolean}
   */
  equals(other) {
    return this.p1.equals(other.p1) && this.p2.equals(other.p2);
  }
}
