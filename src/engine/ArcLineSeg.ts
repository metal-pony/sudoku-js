import { EPSILON, dist } from "./Geo";
import ILineSeg from "./ILineSeg";
import LineSeg from "./LineSeg";
import Point from "./Point";

export default class ArcLineSeg extends LineSeg {
  static readonly TYPE = 'arc';

  protected _radius: number;
  protected _startAngle: number;
  protected _endAngle: number;

  constructor({ p1, radius, startAngle, endAngle }: {
    p1: Point,
    radius: number,
    startAngle: number,
    endAngle: number
  }) {
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

  get type(): string {
    return ArcLineSeg.TYPE;
  }

  get center(): Point {
    return new Point({
      x: this.p1.x + this._radius * Math.cos(this._startAngle + this.angle / 2),
      y: this.p1.y + this._radius * Math.sin(this._startAngle + this.angle / 2)
    });
  }

  calcLength(): number {
    return Math.abs(this._radius * (this._endAngle - this._startAngle));
  }

  calcY(x: number): number {
    const center = this.center;
    const deltaX = x - center.x;
    if (Math.abs(deltaX) > this._radius) {
      return NaN;
    }

    const theta = Math.acos(deltaX / this._radius);
    return (center.y + this._radius * Math.sin(theta));
  }

  calcX(y: number): number {
    const center = this.center;
    const deltaY = y - center.y;
    if (Math.abs(deltaY) > this._radius) {
      return NaN;
    }

    const theta = Math.asin(deltaY / this._radius);
    return (center.x + this._radius * Math.cos(theta));
  }

  isParallel(other: ILineSeg, epsilon: number = EPSILON): boolean {
    if (other instanceof ArcLineSeg) {
      throw new Error("Method not implemented.");
    }

    return false;
  }

  containsPoint(p: Point, epsilon: number = EPSILON): boolean {
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

  freeze(): ArcLineSeg {
    return super.freeze() as ArcLineSeg;
  }

  toString(): string {
    return `${this.isFrozen() ? '!' : ''}ArcLineSeg[${this.p1.toString()}, ${this.p2.toString()}]`;
  }

  equals(other: ArcLineSeg, epsilon: number = EPSILON): boolean {
    return (
      super.equals(other) &&
      Math.abs(this._radius - other._radius) < epsilon &&
      Math.abs(this._startAngle - other._startAngle) < epsilon &&
      Math.abs(this._endAngle - other._endAngle) < epsilon
    );
  }
}
