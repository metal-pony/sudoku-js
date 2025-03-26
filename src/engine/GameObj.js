import Point from './Point.js';
import Polygon from './Polygon.js';
import Vector from '../structs/Vector.js';
import { EPSILON, mag } from './Geo.js';

/*
Responsible for:
  - keeping track of a game object's properties
  - updating properties based on elapsed time
    - position, velocity, rotation, etc
  - rendering itself, provided context
  - dispose() for any clean-up before deletion
*/

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
  poly: new Polygon([
    new Point({ x: 0, y: 0 }),
    new Point({ x: 64, y: 0 }),
    new Point({ x: 64, y: 64 }),
    new Point({ x: 64, y: 0 })
  ]),
  location: new Point({ x: 0, y: 0 }),
  orientation: 0,
  scale: { x: 1, y: 1 },
  velocity: new Vector({ x: 0, y: 0 }),
  acceleration: new Vector({ x: 0, y: 0 }),
  angularVelocity: 0,
  angularAcceleration: 0,
  mass: 0
});

export default class GameObj {
  constructor(options = defaultGameObjSpec()) {
    options = Object.assign(defaultGameObjSpec(), options);
    this._poly = options.poly;
    this._location = options.location;
    this._orientation = options.orientation;
    this._scale = options.scale;
    this._velocity = options.velocity;
    this._acceleration = options.acceleration;
    this._angularVelocity = options.angularVelocity;
    this._angularAcceleration = options.angularAcceleration;
    this._mass = options.mass;

    this._fillStyle = 'magenta';
    this._left = 0;
    this._right = 0;
    this._top = 0;
    this._bottom = 0;
    this._width = 0;
    this._height = 0;

    /**
     * Whether the points that make up the object have been cached.
     * Invaldiate the cache if the object is moved or rotated.
     * @type {boolean}
     */
    this._cached = true;

    /**
     * The cached points that make up the object.
     * @type {Point[]}
     */
    this._points = this._poly._points.map(() => new Point());
    this.calcPoints();
  }

  /**
   * Calculates the points of the object based on its location and orientation.
   * Updates the bounding box of the object (the left, right, top, bottom coordinates).
   */
  calcPoints() {
    this._left = Infinity;
    this._right = -Infinity;
    this._top = Infinity;
    this._bottom = -Infinity;
    for (let i = 0; i < this._points.length; i++) {
      const pt = this._points[i];
      const len = mag(this._poly._points[i]);
      const alpha = this._poly._angles[i];

      pt.x = this._location.x + len * Math.cos(this._orientation + alpha);
      pt.y = this._location.y + len * Math.sin(this._orientation + alpha);

      if (pt.x < this._left) this._left = pt.x;
      if (pt.x > this._right) this._right = pt.x;
      if (pt.y < this._top) this._top = pt.y;
      if (pt.y > this._bottom) this._bottom = pt.y;
    }
    this._width = this._right - this._left;
    this._height = this._bottom - this._top;
    this._cached = true;
  }

  /** @type {Polygon} */
  get poly() { return this._poly; }
  set poly(poly) {
    this._poly = poly;
    this._points = this._poly._points.map(() => new Point());
    this.calcPoints();
  }

  /** The coordinates for the object's origin.*/
  get location() { return this._location; }
  set location(location) {
    this._location.x = location.x;
    this._location.y = location.y;
    this.calcPoints();
  }

  /** The rotation, in radians.*/
  get orientation() { return this._orientation; }
  /** Sets the object's rotation and updates all the object's points.*/
  set orientation(orientation) {
    this._orientation = orientation;
    this.calcPoints();
  }

  get scale() { return this._scale; }
  set scale(scale) {
    this._scale = scale;
    // TODO recalculate points
  }

  /** Vector for object's velocity.*/
  get velocity() { return this._velocity; }
  set velocity(velocity) { this._velocity = velocity; }

  /** Vector for object's acceleration.*/
  get acceleration() { return this._acceleration; }
  set acceleration(acceleration) { this._acceleration = acceleration; }

  /** Object's rotational velocity, in radians. (Negative implies clockwise motion.)*/
  get angularVelocity() { return this._angularVelocity; }
  set angularVelocity(angularVelocity) { this._angularVelocity = angularVelocity; }

  /** Object's rotational acceleration, in radians. (Negative implies clockwise motion.)*/
  get angularAcceleration() { return this._angularAcceleration; }
  set angularAcceleration(angularAcceleration) { this._angularAcceleration = angularAcceleration; }

  /** Object's mass (in whatever units). May be `Infinity`, implying immovability.*/
  get mass() { return this._mass; }
  /** Set the object's mass (in whatever units). May be `Infinity`, implying immovability.*/
  set mass(mass) { this._mass = mass; }
  /** Whether the object is movable, i.e. has positive, finite mass.*/
  get movable() { return this._mass > 0 && this._mass !== Infinity; }

  /** Leftmost x coordinate.*/
  get left() { return this._left; }
  /** Rightmost x coordinate.*/
  get right() {return this._right; }
  /** Topmost y coordinate.*/
  get top() {return this._top; }
  /** Bottommost y coordinate.*/
  get bottom() {return this._bottom; }
  get width() {return this._width; }
  get height() {return this._height; }

  /** Whether the object is at rest.*/
  get stationary() {
    return (
      Math.abs(this._velocity._x) < EPSILON &&
      Math.abs(this._velocity._y) < EPSILON &&
      Math.abs(this._angularVelocity) < EPSILON
    );
  }

  /**
   * Move some distance relative to current position.
   * @param {number} x X Offset
   * @param {number} y Y Offset
   */
  shift(x, y) {
    this._location.x += x;
    this._location.y += y;
    this.calcPoints();
  }

  /**
   * Rotate some angle relative to current orientation.
   * @param {number} angle In radians.
   */
  rotate(angle) {
    this._orientation += angle;
    this.calcPoints();
  }

  /**
   * Checks whether this object intersects the given.
   *
   * TODO NYI
   * @param {GameObj} other The other object to check against.
   * @param {boolean} fine Whether to perform fine-grained check (line intersection of polygons).
   * If false, checks based on bounding boxes.
   * @returns {boolean} True if there's an intersection; otherwise false.
   */
  intersects(other, fine) {
    // TODO
  }

  /**
   * Updates object properties based on elapsed time.
   * @param {number} elapsed The elapsed time since the last update.
   */
  update(elapsedMs) {
    // Move the object based on its velocity and the elapsed time
    const elapsed = elapsedMs / 1000.0;
    this.velocity.x += this.acceleration.x * elapsed;
    this.velocity.y += this.acceleration.y * elapsed;
    this._angularVelocity += this._angularAcceleration * elapsed;
    const xOff = this.velocity.x * elapsed;
    const yOff = this.velocity.y * elapsed;
    const angleOff = this._angularVelocity * elapsed;
    this._location.x += xOff;
    this._location.y += yOff;
    this._orientation += angleOff;
    this.calcPoints();
  }

  /**
   * Renders the object.
   * @param {CanvasRenderingContext2D} context The canvas rendering context.
   */
  render(context) {
    context.save();
    // context.translate(this.location.x, this.location.y);
    // context.rotate(this.orientation);
    // TODO scale NYI, probably won't work properly
    // context.scale(this.scale.x, this.scale.y);

    context.strokeStyle = 'black';
    context.fillStyle = 'magenta';
    context.lineWidth = 1;

    context.beginPath();
    this._points.forEach((pt, i) => {
      if (i === 0) {
        context.moveTo(pt.x, pt.y);
      } else {
        context.lineTo(pt.x, pt.y);
      }
    });
    context.closePath();
    context.fill();
    context.stroke();

    // TODO TEMPORARY WHILE DEBUGGING
    // Draw a small bright circle at the center of the object so we can see it easily while debugging.
    // context.beginPath();
    // context.arc(this._location.x, this._location.y, 4, 0, 2 * Math.PI);
    // context.fillStyle = 'yellow';
    // context.fill();
    // context.stroke();

    context.restore();
  }

  toString() {
    return `GameObj{
      poly: ${this.poly.toString()},
      location: ${this.location.toString()},
      orientation: ${this.orientation},
      scale: ${this.scale},
      velocity: ${this.velocity},
      points: {${this._points.map(pt => pt.toString()).join(', ')}}
    }`;
  }

  dispose() {
    // nothing to do yet
  }
}
