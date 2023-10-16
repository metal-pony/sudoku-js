import Engine from "./Engine";
import Point from "./Point";
import Poly from "./Polygon";
import Vector from "../structs/Vector";

export type GameObjSpec = {
  poly: Poly,
  location: { x: number, y: number },
  orientation?: number,
  scale?: { scaleX: number, scaleY: number }
  velocity?: Vector,
  acceleration?: Vector,
  angularVelocity?: number,
  angularAcceleration?: number,
  mass?: number
};

export default class GameObj {

  private _poly: Poly;

  private _location: Point;
  private _orientation: number;
  private _scale: Point;
  private _velocity: Vector;
  private _acceleration: Vector;
  private _angularVelocity: number;
  private _angularAcceleration: number;
  private _mass: number;

  // friction

  private _left: number = 0;
  private _right: number = 0;
  private _top: number = 0;
  private _bottom: number = 0;
  private _width: number = 0;
  private _height: number = 0;

  constructor({
    poly: poly,
    location: { x, y } = { x: 0, y: 0 },
    orientation = 0,
    scale: { scaleX, scaleY } = { scaleX: 1, scaleY: 1 },
    velocity = new Vector({ x: 0, y: 0 }),
    acceleration = new Vector({ x: 0, y: 0 }),
    angularVelocity = 0,
    angularAcceleration = 0,
    mass = 0
  }: GameObjSpec) {
    this._poly = poly;
    this._location = new Point({ x, y });
    this._orientation = orientation;
    this._scale = new Point({ x: scaleX, y: scaleY });
    this._velocity = velocity;
    this._acceleration = acceleration;
    this._angularVelocity = angularVelocity;
    this._angularAcceleration = angularAcceleration;
    this._mass = mass;
    this._recalcBounds();
  }

  get poly(): Poly {
    return this._poly;
  }

  set poly(poly: Poly) {
    this._poly = poly;
  }

  get location(): Point {
    return this._location;
  }

  set location(location: { x: number, y: number }) {
    this._location.x = location.x;
    this._location.y = location.y;
    this._recalcBounds();
  }

  get orientation(): number {
    return this._orientation;
  }

  set orientation(orientation: number) {
    this._orientation = orientation;
  }

  get scale(): Point {
    return this._scale;
  }

  set scale(scale: Point) {
    this._scale = scale;
  }

  get velocity(): Vector {
    return this._velocity;
  }

  set velocity(velocity: Vector) {
    this._velocity = velocity;
  }

  get acceleration(): Vector {
    return this._acceleration;
  }

  set acceleration(acceleration: Vector) {
    this._acceleration = acceleration;
  }

  get angularVelocity(): number {
    return this._angularVelocity;
  }

  set angularVelocity(angularVelocity: number) {
    this._angularVelocity = angularVelocity;
  }

  get angularAcceleration(): number {
    return this._angularAcceleration;
  }

  set angularAcceleration(angularAcceleration: number) {
    this._angularAcceleration = angularAcceleration;
  }

  get mass(): number {
    return this._mass;
  }

  set mass(mass: number) {
    this._mass = mass;
  }

  get movable(): boolean {
    return this._mass > 0 && this._mass !== Infinity;
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
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  _recalcBounds() {
    this._left = this.poly.points[0].x + this.location.x;
    this._right = this.poly.points[0].x + this.location.x;
    this._top = this.poly.points[0].y + this.location.y;
    this._bottom = this.poly.points[0].y + this.location.y;

    this.poly.points.forEach((pt) => {
      if ((pt.x + this.location.x) < this._left) {
        this._left = pt.x + this.location.x;
      }
      if ((pt.x + this.location.x) > this._right) {
        this._right = pt.x + this.location.x;
      }
      if ((pt.y + this.location.y) < this._top) {
        this._top = pt.y + this.location.y;
      }
      if ((pt.y + this.location.y) > this._bottom) {
        this._bottom = pt.y + this.location.y;
      }
    });

    this._width = this._right - this._left;
    this._height = this._bottom - this._top;
  }

  move({ x: dx, y: dy }: { x: number, y: number }) {
    this.location.x += dx;
    this.location.y += dy;
    this._recalcBounds();
  }

  update(engine: Engine) {
    // Engine.debug('GameObj update');

    // Move
    this.location.x += this.velocity.x / engine.fps;
    this.location.y += this.velocity.y / engine.fps;
    this._recalcBounds();
  }

  render(context: CanvasRenderingContext2D) {
    // Engine.debug('GameObj render');

    context.save();
    context.translate(this.location.x, this.location.y);
    context.rotate(this.orientation);
    context.scale(this.scale.x, this.scale.y);

    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.fillStyle = 'magenta';

    context.beginPath();
    this.poly.points.forEach((point, i) => {
      if (i === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.closePath();
    context.fill();
    context.stroke();

    context.restore();
  }

  toString() {
    return `GameObj{
      poly: ${this.poly},
      location: ${this.location},
      orientation: ${this.orientation},
      scale: ${this.scale},
      velocity: ${this.velocity}
    }`;
  }

  dispose() {
    // nothing to do yet
  }
}
