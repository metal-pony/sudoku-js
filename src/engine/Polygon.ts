import Freezable from "../util/Freezable";
import Point from "./Point";
import LineSeg from "./LineSeg";

type PolySpec = {
  points: { x: number, y: number }[],
  frozen?: boolean
};

export default class Poly extends Freezable {

  private _points: Point[];
  private _lines: LineSeg[];

  constructor(spec: PolySpec) {
    super();

    if (spec.points.length < 3) {
      throw new Error(`Poly must have at least 3 points, got ${spec.points.length}`);
    }

    this._points = spec.points.map(p => new Point(p));
    this._lines = this.calcLines();
    if (spec.frozen) {
      this.freeze();
    }
  }

  get points(): Point[] {
    return this._points;
  }

  set points(points: Point[]) {
    this.throwIfFrozen();
    this._points = points;
    this.calcLines();
  }

  get lines(): LineSeg[] {
    return this._lines;
  }

  calcLines(): LineSeg[] {
    this._lines = [];

    this._points.forEach((p, i) => {
      this._lines.push(new LineSeg({
        p1: p,
        p2: this._points[(i + 1) % this._points.length]
      }));
    });

    return this._lines;
  }

  intersects(other: Poly): boolean {
    return this._lines.some(l => other._lines.some(ol => l.intersects(ol)));
  }

  intersectsLine(line: LineSeg): boolean {
    return this._lines.some(l => l.intersects(line));
  }

  freeze(): Poly {
    this._points.forEach(p => p.freeze());
    this._lines.forEach(l => l.freeze());
    return super.freeze() as Poly;
  }

  toString() {
    return `${this.isFrozen() ? 'F' : ''}Poly{${this.points}}`;
  }
}
