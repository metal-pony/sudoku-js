import ArcLineSeg from './ArcLineSeg.js';
import { EPSILON } from './Geo.js';
import Point from './Point.js';
import Shape from './Shape.js';

export const CircleIntersectionStates = Object.freeze({
  UNKNOWN: 'unknown',
  IDENTICAL_CIRCLES: 'identical circles',
  TOO_FAR_APART: 'too far apart',
  CONTAINED_CIRCLE: 'contained circle',
  SINGLE_POINT: 'single point',
  TWO_POINTS: 'two points'
});

/**
 * Represents the result of a circle intersection calculation.
 * @typedef {Object} CircleIntersectionResult
 * @property {boolean} intersects - Indicates whether the circles intersect.
 * @property {number} distBetween - The distance between the centers of the circles.
 * @property {Point[]} points - The intersection points between the circles.
 * @property {string} state - The state of the intersection.
 */

export default class Circle extends Shape {
  static get INTERSECTION_STATES() { return CircleIntersectionStates };

  /**
   *
   * @param {Point} center
   * @param {number} radius
   */
  constructor(center, radius) {
    super();
    this._center = center;
    this._radius = radius;
    // TODO verify that this is correct. There may need to be a second arc.
    this.resetLines();
  }

  resetLines() {
    this._lines = [];
    this.addLines(
      new ArcLineSeg({
        p1: new Point({
          x: this._center.x + this._radius,
          y: this._center.y
        }),
        radius: this._radius,
        startAngle: 0,
        endAngle: 2 * Math.PI
      })
    );
  }

  get x() {
    return this._center.x;
  }

  get y() {
    return this._center.y;
  }

  get r() {
    return this._radius;
  }

  get center() {
    return this._center;
  }

  set x(x) {
    this.throwIfFrozen();

    const deltaX = x - this._center.x;
    this._lines.forEach(line => line.shift(deltaX, 0));
    this._center.x = x;
  }

  set y(y) {
    this.throwIfFrozen();

    const deltaY = y - this._center.y;
    this._lines.forEach(line => line.shift(0, deltaY));
    this._center.y = y;
  }

  set center(center) {
    this.throwIfFrozen();

    const deltaX = center.x - this._center.x;
    const deltaY = center.y - this._center.y;
    this._lines.forEach(line => line.shift(deltaX, deltaY));
    this._center = center;
  }

  set r(r) {
    this.throwIfFrozen();

    this._radius = r;
    this.resetLines();
  }

  intersection(other, epsilon = EPSILON) {
    const distX = other.x - this.x;
    const distY = other.y - this.y;
    const distBetween = Math.sqrt(distX**2 + distY**2);
    const sumOfRadii = this.r + other.r;

    const points = [];
    const result = {
      intersects: false,
      distBetween,
      points,
      state: Circle.INTERSECTION_STATES.UNKNOWN
    };

    // Too far apart
    if (distBetween > sumOfRadii) {
      result.state = Circle.INTERSECTION_STATES.TOO_FAR_APART;
      return result;
    }

    // One envelopes the other
    if (distBetween < Math.abs(this.r - other.r)) {
      result.state = Circle.INTERSECTION_STATES.CONTAINED_CIRCLE;
      return result;
    }

    // The circles are the same - Infinite points of intersection
    if (this.equals(other)) {
      result.state = Circle.INTERSECTION_STATES.IDENTICAL_CIRCLES;
      result.intersects = true;
      return result;
    }

    // At this point, there is at least one point of intersection.
    result.intersects = true;

    // Distance from the center of this circle to the center of the intersection
    const a = (this.r**2 - other.r**2 + distBetween**2) / (2 * distBetween);
    // The center of the intersection, on the line between the two circle centers
    const midPt = {
      x: this.x + (a * distX / distBetween),
      y: this.y + (a * distY / distBetween)
    };

    // Single point of intersection
    if (
      Math.abs(distBetween - sumOfRadii) < epsilon ||
      Math.abs(distBetween - Math.abs(this.r - other.r)) < epsilon
    ) {
      result.state = Circle.INTERSECTION_STATES.SINGLE_POINT;
      points.push(new Point({
        x: this.x + (a * distX / distBetween),
        y: this.y + (a * distY / distBetween)
      }));
      return result;
    }

    // Distance from the center of the intersection to the intersection point(s)
    const c = Math.sqrt(this.r**2 - a**2);

    result.state = Circle.INTERSECTION_STATES.TWO_POINTS;
    points.push(new Point({
      x: midPt.x - (c * distY / distBetween),
      y: midPt.y + (c * distX / distBetween)
    }));
    points.push(new Point({
      x: midPt.x + (c * distY / distBetween),
      y: midPt.y - (c * distX / distBetween)
    }));

    return result;
  }

  equals(other) {
    return (
      this.center.equals(other.center) &&
      Math.abs(this.r - other.r) < EPSILON
    );
  }

  toString() {
    return `${this.isFrozen() ? '!' : ''}Circle{${this.center.toString()}, r: ${this.r}}`;
  }
}
