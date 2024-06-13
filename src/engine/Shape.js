import Freezable from '../util/Freezable.js';
import LineSeg from './LineSeg.js';

export default class Shape extends Freezable {
  constructor() {
    super();

    /** @type {LineSeg[]} */
    this._lines = [];
    this._closed = false;
    this._left = 0;
    this._right = 0;
    this._top = 0;
    this._bottom = 0;
  }

  get lines() {
    return this._lines;
  }

  /**
   * Gets whether the shape is closed. A shape is closed when all lines
   * are connected in order and the last point is connected to the first point.
   * @returns {boolean} Whether the shape is closed.
   */
  // TODO Expand this definition to take into account lines out of order.
  isClosed() {
    return this._closed;
  }

  /**
   *
   * @param  {LineSeg[]} lines
   * @returns {Shape}
   */
  addLines(...lines) {
    this.throwIfFrozen();

    this._lines.push(...lines);
    this.walk();
    return this;
  }

  /**
   *
   * @param {LineSeg} line
   * @returns {Shape}
   */
  removeLine(line) {
    this.throwIfFrozen();

    const index = this._lines.findIndex(l => line.equals(l));

    if (index === -1) {
      throw new Error(`Cannot remove line from shape, line not found`);
    }

    this._lines.splice(index, 1);
    this.walk();
    return this;
  }

  /**
   *
   * @returns {Shape}
   */
  removeLast() {
    this.throwIfFrozen();

    if (this._lines.length === 0) {
      throw new Error('Cannot remove last line when there are no lines');
    }

    this._lines.pop();
    this.walk();
    return this;
  }

  onUpdate() {
    this.walk();
  }

  /**
   * Validates the polygon by checking that all lines are connected in order
   * and that the last point is connected to the first point.
   */
  walk() {
    this._closed = (
      (this._lines.length >= 1) &&
      this._lines.every((line, i) => (
        line.p2.equals(this._lines[(i + 1) % this._lines.length].p1)
      ))
    );
  }

  freeze() {
    this._lines.forEach(l => l.freeze());
    return super.freeze();
  }

  /**
   *
   * @param {Shape} other
   * @returns {boolean}
   */
  intersects(other) {
    return this._lines.some(l => other._lines.some(ol => l.intersects(ol)));
  }

  /**
   *
   * @param {LineSeg} line
   * @returns {boolean}
   */
  intersectsLine(line) {
    return this._lines.some(l => l.intersects(line));
  }

  /**
   * @returns {string}
   */
  toString() {
    const lines = this._lines.map(l => l.toString()).join(', ');
    return `${this.isFrozen() ? '!' : ''}Shape{${lines}}`;
  }
}
