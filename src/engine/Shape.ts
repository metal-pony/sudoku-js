import { Freezable } from "../util";
import LineSeg from "./LineSeg";

export default abstract class Shape extends Freezable {
  protected _lines: LineSeg[] = [];
  protected _closed: boolean = false;

  protected _left: number = 0;
  protected _right: number = 0;
  protected _top: number = 0;
  protected _bottom: number = -0;

  constructor() {
    super();
  }

  get lines(): LineSeg[] {
    return this._lines;
  }

  /**
   * Gets whether the shape is closed. A shape is closed when all lines
   * are connected in order and the last point is connected to the first point.
   */
  // TODO Expand this definition to take into account lines out of order.
  isClosed(): boolean {
    return this._closed;
  }

  addLines(...lines: LineSeg[]): Shape {
    this.throwIfFrozen();

    this._lines.push(...lines);
    this.walk();
    return this;
  }

  removeLine(line: LineSeg): Shape {
    this.throwIfFrozen();

    const index = this._lines.findIndex(l => line.equals(l));

    if (index === -1) {
      throw new Error(`Cannot remove line from shape, line not found`);
    }

    this._lines.splice(index, 1);
    this.walk();
    return this;
  }

  removeLast(): Shape {
    this.throwIfFrozen();

    if (this._lines.length === 0) {
      throw new Error('Cannot remove last line when there are no lines');
    }

    this._lines.pop();
    this.walk();
    return this;
  }

  protected onUpdate(): void {
    this.walk();
  }

  /**
   * Validates the polygon by checking that all lines are connected in order
   * and that the last point is connected to the first point.
   */
  protected walk() {
    this._closed = (
      (this._lines.length >= 1) &&
      this._lines.every((line, i) => (
        line.p2.equals(this._lines[(i + 1) % this._lines.length].p1)
      ))
    );
  }

  freeze(): Shape {
    this._lines.forEach(l => l.freeze());
    return super.freeze() as Shape;
  }

  intersects(other: Shape): boolean {
    return this._lines.some(l => other._lines.some(ol => l.intersects(ol)));
  }

  intersectsLine(line: LineSeg): boolean {
    return this._lines.some(l => l.intersects(line));
  }

  toString() {
    const lines = this._lines.map(l => l.toString()).join(', ');
    return `${this.isFrozen() ? '!' : ''}Shape{${lines}}`;
  }
}
