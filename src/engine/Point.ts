import Freezable from "../util/Freezable";
import { EPSILON } from "./Geo";

export default class Point extends Freezable {
  protected _x: number;
  protected _y: number;

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
    return `${this.isFrozen() ? '!' : ''}(${this.x}, ${this.y})`;
  }

  equals(other: Point, epsilon: number = EPSILON): boolean {
    return Math.abs(this.x - other.x) < epsilon && Math.abs(this.y - other.y) < epsilon;
  }
}
