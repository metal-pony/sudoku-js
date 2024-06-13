import { range, shuffle } from '../util/arrays.js';
import { SHAPES, Shape } from './Shape.js';

export default class ShapeQueue {
  /** Default minimum queue size.*/
  static get DEFAULT_SIZE() { return 14; }

  /**
   * Returns a new ShapeQueue with the same minimum size and shapes as the given ShapeQueue.
   * @param {ShapeQueue} other The ShapeQueue to copy.
   * @returns {ShapeQueue} A copy of the given ShapeQueue.
   */
  static copy(other) {
    const copy = new ShapeQueue(other._minSize);
    copy._shapes.push(...other._shapes);
    return copy;
  }

  /**
   * Creates a new ShapeQueue with the given minimum size.
   * @param {number} minSize The minimum number of elements to keep in this ShapeQueue.
   */
  constructor(minSize = ShapeQueue.DEFAULT_SIZE) {
    this._minSize = minSize;
    this._shapes = [];
  }

  /**
   * @returns {number} The number of elements currently in this ShapeQueue.
   */
  get size() {
    return this._shapes.length;
  }

  /**
   * @returns {boolean} True if this ShapeQueue is empty, false otherwise.
   */
  isEmpty() {
    return this.size === 0;
  }

  /**
   * Removes the element at the front of this ShapeQueue.
   * If this ShapeQueue is empty or has fewer than minSize elements, more elements will be generated.
   * @returns {Shape} The element at the front of this ShapeQueue.
   */
  poll() {
    this._ensureCapacity(this._minSize + 1);
    const shapeIndex = this._shapes.shift();

    // shapeIndex is guaranteed to be defined because we just ensured capacity
    return Shape.byValue(shapeIndex || 0);
  }

  /**
   * Returns the element at the front of this ShapeQueue without removing it.
   * @returns {Shape}
   */
  peek() {
    this._ensureCapacity(this._minSize);
    const shapeIndex = this._shapes[0];

    // shapeIndex is guaranteed to be defined because we just ensured capacity
    return Shape.byValue(shapeIndex || 0);
  }

  /**
   * Returns the next n elements in this ShapeQueue without removing them.
   * @param {number} n The number of elements to peek.
   * @returns {Shape[]} An array of the next n elements in this ShapeQueue.
   */
  peekNext(n) {
    this._ensureCapacity(this._minSize + n);
    return this._shapes.slice(0, n).map((shapeIndex) => {
      // shapeIndex is guaranteed to be defined because we just ensured capacity
      return Shape.byValue(shapeIndex || 0);
    });
  }

  /** Removes all elements from this ShapeQueue.*/
  clear() {
    this._shapes = [];
  }

  /** Ensures that this ShapeQueue has at least the given capacity.*/
  _ensureCapacity(capacity) {
    while (this.size < capacity) {
      this._shapes.push(...randomizeShapeIndices());
    }
  }
}

/** @returns {number[]} An array of shape indices in random order.*/
export const randomizeShapeIndices = () => {
  return shuffle(range(SHAPES.length + 1, 1));
};
