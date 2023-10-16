import Freezable from "../util/Freezable";
import Point from "./Point";
import { EPSILON, dist } from "./Geo";

export default class LineSeg extends Freezable {

  private _p1: Point;
  private _p2: Point;

  private _m: number = 0;
  private _b: number = 0;
  private _length: number = 0;
  private _angle: number = 0;

  constructor({ p1, p2 }: { p1: Point, p2: Point }) {
    super();
    this._p1 = p1;
    this._p2 = p2;
    this._recalc();
  }

  get p1(): Point {
    return this._p1;
  }

  get p2(): Point {
    return this._p2;
  }

  set p1(p1: Point) {
    this.throwIfFrozen();
    this._p1 = p1;
    this._recalc();
  }

  set p2(p2: Point) {
    this.throwIfFrozen();
    this._p2 = p2;
    this._recalc();
  }

  get m(): number {
    return this._m;
  }

  get b(): number {
    return this._b;
  }

  get length() {
    return this._length;
  }

  get angle(): number {
    return this._angle;
  }

  get angleDeg(): number {
    return this._angle * 180 / Math.PI;
  }

  private _recalc(): void {
    this._m = (this._p2.y - this._p1.y) / (this._p2.x - this._p1.x);
    this._b = this._p1.y - this._m * this._p1.x;
    this._length = dist(this._p1, this._p2);
    this._angle = Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);

    if (!this.hasSlope()) {
      this._m = Infinity;
      this._b = Infinity;
    }
  }

  hasSlope(): boolean {
    return Math.abs(this._m) !== Infinity;
  }

  hasYIntercept(): boolean {
    return Math.abs(this._b) !== Infinity;
  }

  isParallel(other: LineSeg, epsilon: number = EPSILON): boolean {
    return Math.abs(this.m - other.m) < epsilon;
  }

  atX(x: number): number {
    return this.m * x + this.b;
  }

  atY(y: number): number {
    return (y - this.b) / this.m;
  }

  containsPoint(
    pt: { x : number, y: number },
    epsilon: number = EPSILON
  ): boolean {
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

  intersects(other: LineSeg, epsilon: number = EPSILON): boolean {
    if (this.equals(other)) {
      return true;
    }

    // Check if any of the endpoints are on the other line.
    // Handles the all cases where the lines are parallel.
    if (
      this.containsPoint(other.p1, epsilon) ||
      this.containsPoint(other.p2, epsilon) ||
      other.containsPoint(this.p1, epsilon) ||
      other.containsPoint(this.p2, epsilon)
    ) {
      return true;
    }

    // If parallel and above didn't return, then they don't intersect.
    if (this.isParallel(other, epsilon)) {
      return false;
    }

    // Find the intersection point.
    let x, y;
    if (this.hasSlope() && other.hasSlope()) {
      x = (other.b - this.b) / (this.m - other.m);
      y = this.m * x + this.b;
    } else if (this.hasSlope()) {
      x = other.p1.x;
      y = this.m * x + this.b;
    } else {
      x = this.p1.x;
      y = other.m * x + other.b;
    }

    // Check if the intersection point is on both lines.
    return (
      this.containsPoint(new Point({ x, y }), epsilon) &&
      other.containsPoint(new Point({ x, y }), epsilon)
    );
  }

  freeze(): LineSeg {
    this._p1.freeze();
    this._p2.freeze();

    return super.freeze() as LineSeg;
  }

  toString() {
    return `${this.isFrozen() ? 'F' : ''}{${this.p1}, ${this.p2}}`;
  }

  equals(other: LineSeg): boolean {
    return this.p1.equals(other.p1) && this.p2.equals(other.p2);
  }
}
