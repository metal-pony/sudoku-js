import Point from "./Point";
import LinearLineSeg from "./LinearLineSeg";
import Shape from "./Shape";

export default class Polygon extends Shape {
  static readonly MIN_LINES = 3;
  static readonly MIN_LINES_TO_CLOSE = 2;
  static readonly CANNOT_CLOSE_ERR_MSG = `Cannot close a Polygon; Need at least ${Polygon.MIN_LINES_TO_CLOSE} lines`;

  static fromPoints(points: Point[]): Polygon {
    const poly = new Polygon();
    points.forEach((p, i) => (
      poly._lines.push(new LinearLineSeg([p, points[(i + 1) % points.length]]))
    ));
    poly.onUpdate();
    return poly;
  }

  protected _left: number = 0;
  protected _right: number = 0;
  protected _top: number = 0;
  protected _bottom: number = -0;

  constructor() {
    super();
  }

  get left(): number {
    return this._left;
  }

  get right(): number {
    return this._right;
  }

  get top(): number {
    return this._top;
  }

  get bottom(): number {
    return this._bottom;
  }

  get width(): number {
    return this._right - this._left;
  }

  get height(): number {
    return this._bottom - this._top;
  }

  addLines(...lines: LinearLineSeg[]): Polygon {
    this.throwIfFrozen();

    this._lines.push(...lines);
    this.onUpdate();
    return this;
  }

  addLineToPoint(point: Point): Polygon {
    this.throwIfFrozen();

    if (this._lines.length === 0) {
      throw new Error('Cannot add line to point when there are no lines');
    }

    return this.addLines(
      new LinearLineSeg([this._lines[this._lines.length - 1].p2, point])
    );
  }

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

  protected onUpdate(): void {
    super.onUpdate();
    this.findBounds();
  }

  protected findBounds(): void {
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
  protected walk() {
    this._closed = (
      (this._lines.length >= Polygon.MIN_LINES) &&
      this._lines.every((line, i) => (
        line.p2.equals(this._lines[(i + 1) % this._lines.length].p1)
      ))
    );
  }

  toString() {
    const lines = this._lines.map(l => l.toString()).join(', ');
    return `${this.isFrozen() ? '!' : ''}Poly{${lines}}`;
  }
}
