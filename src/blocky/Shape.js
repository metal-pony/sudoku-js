import Coord from "../structs/Coord";
import ZMod from "../util/ZMod";

export class Shape {
  static get O() { return O; }
  static get I() { return I; }
  static get S() { return S; }
  static get Z() { return Z; }
  static get L() { return L; }
  static get J() { return J; }
  static get T() { return T; }

  /**
   * @param {number} value
   * @returns {Shape | null}
   */
  static byValue(value) {
    return SHAPES.find(shape => shape.value === value) || null;
  }

  /**
   * @param {number} value
   * @param {number[]} offsets
   */
  constructor(value, offsets) {
    this.value = value;
    this._offsets = this.buildOffsets(offsets);
  }

  get numRotations() {
    return this._offsets.length;
  }

  /**
   *
   * @param {number} rotation
   * @returns {Coord[]}
   */
  getRotation(rotation) {
    return this._offsets[ZMod.apply(rotation, this.numRotations)];
  }

  /**
   *
   * @param {number[]} vals
   * @returns {Coord[][]}
   */
  buildOffsets(vals) {
		const numRotations = Math.floor(vals.length / 8);

    // initialize result double array
    /** @type {Coord[][]} */
    const result = new Array(numRotations);

    // iterate over rotations
    for (
      let rotationIndex = 0;
      rotationIndex < numRotations;
      rotationIndex++
    ) {
      // initialize result[rotationIndex] array
      result[rotationIndex] = new Array(4);

      // iterate over blocks
      for (
        let blockIndex = 0;
        blockIndex < 4;
        blockIndex++
      ) {
        // initialize result[rotationIndex][blockIndex] array
        result[rotationIndex][blockIndex] = new Coord(
          vals[rotationIndex * 8 + blockIndex * 2],
          vals[rotationIndex * 8 + blockIndex * 2 + 1]
        ).freeze();
      }
    }

		return result;
	}
}

const O = new Shape(1, [
  0,-1, 0,0, 1,-1, 1,0
]);
const I = new Shape(2, [
  0,0, 0,-1, 0,-2, 0,1,
  0,0, -1,0, 1,0, 2,0
]);
const S = new Shape(3, [
  0,0, 0,1, 1,-1, 1,0,
  0,0, -1,0, 0,1, 1,1
]);
const Z = new Shape(4, [
  0,0, 0,-1, 1,0, 1,1,
  0,0, 0,1, 1,0, -1,1
]);
const L = new Shape(5, [
  0,-1, 0,0, 0,1, 1,-1,
  -1,0, 0,0, 1,0, 1,1,
  0,-1, 0,0, 0,1, -1,1,
  -1,-1, -1,0, 0,0, 1,0
]);
const J = new Shape(6, [
  0,-1, 0,0, 0,1, 1,1,
  -1,0, -1,1, 0,0, 1,0,
  -1,-1, 0,-1, 0,0, 0,1,
  -1,0, 0,0, 1,-1, 1,0
]);
const T = new Shape(7, [
  0,-1, 0,0, 0,1, 1,0,
  -1,0, 0,0, 0,1, 1,0,
  -1,0, 0,-1, 0,0, 0,1,
  -1,0, 0,-1, 0,0, 1,0
]);

export const SHAPES = [O, I, S, Z, L, J, T];
