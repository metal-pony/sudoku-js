import Point from "./Point";
import { EPSILON } from "./Geo";
import ILineSeg from "./ILineSeg";
import LineSeg from "./LineSeg";

export default class LinearLineSeg extends LineSeg {
  static readonly TYPE = 'linear';

  private _m: number = 0;
  private _b: number = 0;

  constructor(points: Point[]) {
    super(points);
  }

  get type(): string {
    return LinearLineSeg.TYPE;
  }

  get p1(): Point {
    return super.p1;
  }

  set p1(p1: Point) {
    super.p1 = p1;
    this._memo();
  }

  get p2(): Point {
    return super.p2;
  }

  set p2(p2: Point) {
    super.p2 = p2;
    this._memo();
  }

  get m(): number {
    return this._m;
  }

  get b(): number {
    return this._b;
  }

  protected _memo(): void {
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

  hasSlope(): boolean {
    return Math.abs(this._m) !== Infinity;
  }

  hasYIntercept(): boolean {
    return Math.abs(this._b) !== Infinity;
  }

  isParallel(other: ILineSeg, epsilon: number = EPSILON): boolean {
    if (other instanceof LinearLineSeg) {
      return Math.abs(this.m - other.m) < epsilon;
    }

    return false;
  }

  calcLength(): number {
    return Math.sqrt((this.p2.x - this.p1.x)**2 + (this.p2.y - this.p1.y)**2);
  }

  calcY(x: number): number {
    return this.m * x + this.b;
  }

  calcX(y: number): number {
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

  freeze(): LinearLineSeg {
    return super.freeze() as LinearLineSeg;
  }

  toString() {
    return `${this.isFrozen() ? '!' : ''}LinearLineSeg{${this.p1}, ${this.p2}}`;
  }

  equals(other: LinearLineSeg, epsilon: number = EPSILON): boolean {
    return (
      super.equals(other) &&
      Math.abs(this.m - other.m) < epsilon &&
      Math.abs(this.b - other.b) < epsilon
    );
  }
}
