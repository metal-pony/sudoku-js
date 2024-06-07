import { EPSILON, dist } from "./Geo";
import LineSeg from "./LineSeg";
import Point from "./Point";

const TYPE = 'arc';

export default class ArcLineSeg extends LineSeg {
  static get TYPE() { return TYPE; }

  // protected _radius: number;
  // protected _startAngle: number;
  // protected _endAngle: number;

  /**
   *
   * @param {{
   *   p1: Point,
   *   radius: number,
   *   startAngle: number,
   *   endAngle: number
   * }} options
   * @param {Point} options.p1 The starting point of the arc.
   * @param {number} options.radius The radius of the arc.
   * @param {number} options.startAngle The starting angle of the arc (radians).
   * @param {number} options.endAngle The ending angle of the arc (radians).
   */
  constructor({ p1, radius, startAngle, endAngle }) {
    super([
      p1,
      new Point({
        x: p1.x + radius * Math.cos(endAngle),
        y: p1.y + radius * Math.sin(endAngle)
      })
    ]);

    this._radius = radius;
    this._startAngle = startAngle;
    this._endAngle = endAngle;
  }

  get type() {
    return ArcLineSeg.TYPE;
  }

  /**
   * @type {Point} The center point of the arc.
   */
  get center() {
    return new Point({
      x: this.p1.x + this._radius * Math.cos(this._startAngle + this.angle / 2),
      y: this.p1.y + this._radius * Math.sin(this._startAngle + this.angle / 2)
    });
  }

  /**
   * @returns {number} The angle of the arc in radians.
   */
  calcLength() {
    return Math.abs(this._radius * (this._endAngle - this._startAngle));
  }

  /**
   * Calculates the y-coordinate of the arc at the given x-coordinate.
   * @param {number} x The x-coordinate to calculate the y-coordinate for.
   * @returns {number} The y-coordinate of the arc at the given x-coordinate.
   */
  calcY(x) {
    const center = this.center;
    const deltaX = x - center.x;
    if (Math.abs(deltaX) > this._radius) {
      return NaN;
    }

    const theta = Math.acos(deltaX / this._radius);
    return (center.y + this._radius * Math.sin(theta));
  }

  /**
   * Calculates the x-coordinate of the arc at the given y-coordinate.
   * @param {number} y The y-coordinate to calculate the x-coordinate for.
   * @returns {number} The x-coordinate of the arc at the given y-coordinate.
   */
  calcX(y) {
    const center = this.center;
    const deltaY = y - center.y;
    if (Math.abs(deltaY) > this._radius) {
      return NaN;
    }

    const theta = Math.asin(deltaY / this._radius);
    return (center.x + this._radius * Math.cos(theta));
  }

  /**
   *
   * @param {LineSeg} other
   * @param {number} epsilon
   * @returns {boolean}
   */
  isParallel(other, epsilon = EPSILON) {
    if (other instanceof ArcLineSeg) {
      throw new Error("Method not implemented.");
    }

    return false;
  }

  /**
   *
   * @param {Point} p
   * @param {number} epsilon
   * @returns {boolean}
   */
  containsPoint(p, epsilon = EPSILON) {
    // The distance between the point and the center of the arc must be
    // equal to the radius of the arc, with some precision.
    const center = this.center;
    if (Math.abs(dist(p, center) - this._radius) > epsilon) {
      return false;
    }

    // theta = angle between the point and the center of the arc
    const theta = Math.atan2(
      p.y - center.y,
      p.x - center.x
    );

    return (
      theta >= this._startAngle - epsilon &&
      theta <= this._endAngle + epsilon
    );
  }

  /**
   * @returns {string} A string representation of the arc line segment.
   */
  toString() {
    return `${this.isFrozen() ? '!' : ''}ArcLineSeg[${this.p1.toString()}, ${this.p2.toString()}]`;
  }

  /**
   *
   * @param {ArcLineSeg} other
   * @param {number} epsilon
   * @returns {boolean}
   */
  equals(other, epsilon = EPSILON) {
    return (
      super.equals(other) &&
      Math.abs(this._radius - other._radius) < epsilon &&
      Math.abs(this._startAngle - other._startAngle) < epsilon &&
      Math.abs(this._endAngle - other._endAngle) < epsilon
    );
  }
}
