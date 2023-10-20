import { Freezable } from "../util";
import { EPSILON } from "./Geo";
import ILineSeg from "./ILineSeg";
import { intersects } from "./IntersectionMap";
import Point from "./Point";

export default abstract class LineSeg extends Freezable implements ILineSeg {
  static readonly MIN_POINTS = 2;
  static readonly INVALID_POINTS_ERR_MSG = `A Line segment must have exactly ${LineSeg.MIN_POINTS} points`;

  protected _points: Point[];
  protected _angle: number = 0;
  protected _angleDeg: number = 0;
  protected _length: number = 0;

  constructor(points: Point[]) {
    super();

    if (points.length !== LineSeg.MIN_POINTS) {
      throw new Error(`${LineSeg.INVALID_POINTS_ERR_MSG}, got ${points.length}`);
    }

    this._points = points;
    this._memo();
  }

  protected _memo(): void {
    this._angle = Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
    this._angleDeg = this._angle * 180 / Math.PI;
    this._length = this.calcLength();
  }

  abstract get type(): string;

  get p1(): Point {
    return this._points[0];
  }

  set p1(p1: Point) {
    this.throwIfFrozen();
    this._points[0] = p1;
    this._memo();
  }

  get p2(): Point {
    return this._points[1];
  }

  set p2(p2: Point) {
    this.throwIfFrozen();
    this._points[1] = p2;
    this._memo();
  }

  get length(): number {
    return this._length;
  }

  get angle(): number {
    return this._angle;
  }

  get angleDeg(): number {
    return this._angleDeg;
  }

  move(x: number, y: number): void {
    this.throwIfFrozen();

    this.p1.x += x;
    this.p1.y += y;
    this.p2.x += x;
    this.p2.y += y;

    this._memo();
  }

  abstract calcLength(): number;
  abstract calcX(y: number): number;
  abstract calcY(x: number): number;
  abstract isParallel(other: LineSeg): boolean;
  abstract containsPoint(p: Point): boolean;

  intersects(other: LineSeg, epsilon: number = EPSILON): boolean {
    return intersects(this, other, epsilon);
  }

  freeze(): LineSeg {
    this.p1.freeze();
    this.p2.freeze();

    return super.freeze() as LineSeg;
  }

  toString() {
    return `${this.isFrozen() ? '!' : ''}LineSeg[${this.p1.toString()}, ${this.p2.toString()}]`;
  }

  equals(other: LineSeg): boolean {
    return this.p1.equals(other.p1) && this.p2.equals(other.p2);
  }
}
