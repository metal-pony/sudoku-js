import Engine from './Engine';
import Point from './Point';
import Polygon from './Polygon';
import Vector from '../structs/Vector';

/**
 * Represents a game object.
 * @typedef {Object} GameObjSpec - The specification for creating a game object.
 * @property {Polygon} poly - The polygon shape of the game object.
 * @property {Object} location - The location of the game object.
 * @property {number} location.x - The x-coordinate of the game object's location.
 * @property {number} location.y - The y-coordinate of the game object's location.
 * @property {number} [orientation=0] - The orientation of the game object in radians.
 * @property {Object} [scale] - The scale of the game object.
 * @property {number} scale.scaleX - The scale factor along the x-axis.
 * @property {number} scale.scaleY - The scale factor along the y-axis.
 * @property {Vector} [velocity] - The velocity of the game object.
 * @property {Vector} [acceleration] - The acceleration of the game object.
 * @property {number} [angularVelocity=0] - The angular velocity of the game object in radians per second.
 * @property {number} [angularAcceleration=0] - The angular acceleration of the game object in radians per second squared.
 * @property {number} [mass=0] - The mass of the game object.
 */

const defaultGameObjSpec = () => ({
  poly: new Polygon(),
  location: new Point({ x: 0, y: 0 }),
  orientation: 0,
  scale: { scaleX: 1, scaleY: 1 },
  velocity: new Vector({ x: 0, y: 0 }),
  acceleration: new Vector({ x: 0, y: 0 }),
  angularVelocity: 0,
  angularAcceleration: 0,
  mass: 0
});

export default class GameObj {
  constructor(options = defaultGameObjSpec()) {
    this._poly = options.poly;
    this._location = options.location;
    this._orientation = options.orientation;
    this._scale = options.scale;
    this._velocity = options.velocity;
    this._acceleration = options.acceleration;
    this._angularVelocity = options.angularVelocity;
    this._angularAcceleration = options.angularAcceleration;
    this._mass = options.mass;
    this._recalcBounds();

    this._left = 0;
    this._right = 0;
    this._top = 0;
    this._bottom = 0;
    this._width = 0;
    this._height = 0;
  }

  get poly() {
    return this._poly;
  }

  set poly(poly) {
    this._poly = poly;
  }

  get location() {
    return this._location;
  }

  set location(location) {
    this._location.x = location.x;
    this._location.y = location.y;
    this._recalcBounds();
  }

  get orientation() {
    return this._orientation;
  }

  set orientation(orientation) {
    this._orientation = orientation;
  }

  get scale() {
    return this._scale;
  }

  set scale(scale) {
    this._scale = scale;
  }

  get velocity() {
    return this._velocity;
  }

  set velocity(velocity) {
    this._velocity = velocity;
  }

  get acceleration() {
    return this._acceleration;
  }

  set acceleration(acceleration) {
    this._acceleration = acceleration;
  }

  get angularVelocity() {
    return this._angularVelocity;
  }

  set angularVelocity(angularVelocity) {
    this._angularVelocity = angularVelocity;
  }

  get angularAcceleration() {
    return this._angularAcceleration;
  }

  set angularAcceleration(angularAcceleration) {
    this._angularAcceleration = angularAcceleration;
  }

  get mass() {
    return this._mass;
  }

  set mass(mass) {
    this._mass = mass;
  }

  get movable() {
    return this._mass > 0 && this._mass !== Infinity;
  }

  get left() {
    return this._left;
  }

  get right() {
    return this._right;
  }

  get top() {
    return this._top;
  }

  get bottom() {
    return this._bottom;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  _recalcBounds() {
    // this._left = this.poly.points[0].x + this.location.x;
    // this._right = this.poly.points[0].x + this.location.x;
    // this._top = this.poly.points[0].y + this.location.y;
    // this._bottom = this.poly.points[0].y + this.location.y;

    this._left = this.location.x + this.poly.left;
    this._right = this.location.x + this.poly.right;
    this._top = this.location.y + this.poly.top;
    this._bottom = this.location.y + this.poly.bottom;

    // this.poly.points.forEach((pt) => {
    //   if ((pt.x + this.location.x) < this._left) {
    //     this._left = pt.x + this.location.x;
    //   }
    //   if ((pt.x + this.location.x) > this._right) {
    //     this._right = pt.x + this.location.x;
    //   }
    //   if ((pt.y + this.location.y) < this._top) {
    //     this._top = pt.y + this.location.y;
    //   }
    //   if ((pt.y + this.location.y) > this._bottom) {
    //     this._bottom = pt.y + this.location.y;
    //   }
    // });

    this._width = this._right - this._left;
    this._height = this._bottom - this._top;
  }

  /**
   *
   * @param {Point} point
   */
  move({ x: dx, y: dy }) {
    this.location.x += dx;
    this.location.y += dy;
    this._recalcBounds();
  }

  /**
   *
   * @param {Engine} engine The game engine.
   * @param {number} elapsed The elapsed time since the last update.
   */
  update(engine, elapsedMs) {
    // Engine.debug('GameObj update');

    // Move the object based on its velocity and the elapsed time
    this.location.x += this.velocity.x * elapsedMs / 1000;
    this.location.y += this.velocity.y * elapsedMs / 1000;
    this._recalcBounds();
  }

  /**
   *
   * @param {CanvasRenderingContext2D} context
   */
  render(context) {
    // Engine.debug('GameObj render');

    context.save();
    context.translate(this.location.x, this.location.y);
    context.rotate(this.orientation);
    context.scale(this.scale.x, this.scale.y);

    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.fillStyle = 'magenta';

    context.beginPath();
    this.poly.lines.forEach((line, i) => {
      if (i === 0) {
        context.moveTo(line.p1.x, line.p1.y);
      } else {
        context.lineTo(line.p1.x, line.p1.y);
      }
    });
    context.closePath();
    context.fill();
    context.stroke();

    context.restore();
  }

  /**
   * @returns {string}
   */
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
