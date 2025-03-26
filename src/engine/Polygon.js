import Point from './Point.js';
import LinearLineSeg from './LinearLineSeg.js';
import Shape from './Shape.js';
import { direction } from './Geo.js';

const MIN_LINES = 3;
const MIN_LINES_TO_CLOSE = 2;
const CANNOT_CLOSE_ERR_MSG = `Cannot close a Polygon; Need at least ${MIN_LINES_TO_CLOSE} lines`;

export default class Polygon extends Shape {
  static get MIN_LINES() { return MIN_LINES; }
  static get MIN_LINES_TO_CLOSE() { return MIN_LINES_TO_CLOSE; }
  static get CANNOT_CLOSE_ERR_MSG() { return CANNOT_CLOSE_ERR_MSG; }

  /**
   *
   * @param {Point[]} points
   */
  constructor(points) {
    super();

    this._left = 0;
    this._right = 0;
    this._top = 0;
    this._bottom = 0;
    this._points = points;
    this._angles = points.map(direction);
  }

  /** Leftmost x coordinate.*/
  get left() { return this._left; }
  /** Rightmost x coordinate.*/
  get right() { return this._right; }
  /** Topmost y coordinate.*/
  get top() { return this._top; }
  /** Bottommost y coordinate.*/
  get bottom() { return this._bottom; }
  get width() { return this._right - this._left; }
  get height() { return this._bottom - this._top; }

  /**
   *
   * @param {Point} center
   */
  moveTo(center) {
    const dx = center.x - this._center.x;
    const dy = center.y - this._center.y;
    this.shift(new Point({ x: dx, y: dy }));
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  shift(x, y) {
    this._lines.forEach(line => {
      line.shift(x, y);
    });
    this.findBounds();
  }

  /**
   * Rotates the polygon the given amount of radians.
   * TODO NYI
   * @param {number} rads
   */
  rotate(rads) {
    console.log('(GameObj) rotate: NYI');
  }

  /**
   *
   * @param {CanvasRenderingContext2D} context
   */
  // renderingPath(context) {
  //   context.beginPath();
  //   this._lines.forEach((line, i) => {
  //     if (i === 0) {
  //       context.moveTo(line.p1.x, line.p1.y);
  //     }
  //     context.lineTo(line.p2.x, line.p2.y);
  //   });
  //   // The lines should be closed, so there is no need to close the path.
  // }

  /**
   * Adds the given lines to the polygon, then calls onUpdate.
   * @param  {LinearLineSeg[]} lines
   * @returns  {Polygon}
   */
  addLines(...lines) {
    this.throwIfFrozen();

    this._lines.push(...lines);
    this.onUpdate();
    return this;
  }

  /**
   * Adds a line from the last point in the polygon to the given point.
   * @param {Point} point
   * @returns {Polygon}
   */
  addLineToPoint(point) {
    this.throwIfFrozen();

    if (this._lines.length === 0) {
      throw new Error('Cannot add line to point when there are no lines');
    }

    return this.addLines(
      new LinearLineSeg([this._lines[this._lines.length - 1].p2, point])
    );
  }

  /**
   * Attempts to close the polygon by adding lines from the last point to the first point.
   */
  close() {
    this.throwIfFrozen();

    if (this._lines.length < Polygon.MIN_LINES_TO_CLOSE) {
      throw new Error(`${Polygon.CANNOT_CLOSE_ERR_MSG}, (${this._lines.length})`);
    }

    // TODO Can this be done with reduce?
    const linesToAdd = [];
    for (let i = 0; i < this._lines.length - 1; i++) {
      const line = this._lines[i];
      const next = this._lines[(i + 1) % this._lines.length];
      if (!line.p2.equals(next.p1)) {
        linesToAdd.push(new LinearLineSeg([line.p2, next.p1]));
      }
    }
    this.addLines(...linesToAdd);
  }

  onUpdate() {
    super.onUpdate();
    this.findBounds();
  }

  /**
   * Calculates and caches the left, right, top, and bottom bounds of the polygon.
   */
  findBounds() {
    this._left = Infinity;
    this._right = -Infinity;
    this._top = Infinity;
    this._bottom = -Infinity;

    this._lines.forEach(line => {
      this._left = Math.min(this._left, line.p1.x, line.p2.x);
      this._right = Math.max(this._right, line.p1.x, line.p2.x);
      this._top = Math.min(this._top, line.p1.y, line.p2.y);
      this._bottom = Math.max(this._bottom, line.p1.y, line.p2.y);
    });
  }

  /**
   * Validates the polygon by checking that all lines are connected in order
   * and that the last point is connected to the first point.
   */
  walk() {
    this._closed = (
      (this._lines.length >= Polygon.MIN_LINES) &&
      this._lines.every((line, i) => (
        line.p2.equals(this._lines[(i + 1) % this._lines.length].p1)
      ))
    );
  }

  toString() {
    return this._points.map(p => p.toString()).join(', ');
  }
}
