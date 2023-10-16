import Freezable from "../util/Freezable";

export default class Vector extends Freezable {
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

  add(other: Vector): Vector {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  sub(other: Vector): Vector {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  mul(scalar: number): Vector {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  div(scalar: number): Vector {
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }

  dot(other: Vector): number {
    return this.x * other.x + this.y * other.y;
  }

  cross(other: Vector): number {
    return this.x * other.y - this.y * other.x;
  }

  mag(): number {
    return Math.sqrt(this.x**2 + this.y**2);
  }

  unit(): Vector {
    return this.div(this.mag());
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  angleDeg(): number {
    return this.angle() * 180 / Math.PI;
  }

  rotate(angle: number): Vector {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.x = this.x * cos - this.y * sin;
    this.y = this.y * cos + this.x * sin;
    return this;
  }

  toString() {
    return `<${this.x}, ${this.y}>`;
  }

  equals(other: Vector): boolean {
    return this.x === other.x && this.y === other.y;
  }
}
