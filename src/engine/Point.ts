import Freezable from "../util/Freezable";

export default class Point extends Freezable {

  private _x: number;
  private _y: number;

  constructor({ x, y }: { x: number, y: number }) {
    super();

    this._x = x;
    this._y = y;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  set x(x: number) {
    this.throwIfFrozen();
    this._x = x;
  }

  set y(y: number) {
    this.throwIfFrozen();
    this._y = y;
  }

  dist(other: Point): number {
    return Math.sqrt((other.x - this.x)**2 + (other.y - this.y)**2)
  };

  toString() {
    return `${this.isFrozen() ? 'F' : ''}(${this.x}, ${this.y})`;
  }

  equals(other: Point): boolean {
    return this.x === other.x && this.y === other.y;
  }
}
