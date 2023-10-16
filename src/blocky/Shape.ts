import Coord from "../structs/Coord";
import ZMod from "../util/ZMod";

export class Shape {
  static readonly O = new Shape(1, [
    0,-1, 0,0, 1,-1, 1,0
  ]);
  static readonly I = new Shape(2, [
    0,0, 0,-1, 0,-2, 0,1,
    0,0, -1,0, 1,0, 2,0
  ]);
  static readonly S = new Shape(3, [
    0,0, 0,1, 1,-1, 1,0,
    0,0, -1,0, 0,1, 1,1
  ]);
  static readonly Z = new Shape(4, [
    0,0, 0,-1, 1,0, 1,1,
    0,0, 0,1, 1,0, -1,1
  ]);
  static readonly L = new Shape(5, [
    0,-1, 0,0, 0,1, 1,-1,
    -1,0, 0,0, 1,0, 1,1,
    0,-1, 0,0, 0,1, -1,1,
    -1,-1, -1,0, 0,0, 1,0
  ]);
  static readonly J = new Shape(6, [
    0,-1, 0,0, 0,1, 1,1,
		-1,0, -1,1, 0,0, 1,0,
		-1,-1, 0,-1, 0,0, 0,1,
		-1,0, 0,0, 1,-1, 1,0
  ]);
  static readonly T = new Shape(7, [
    0,-1, 0,0, 0,1, 1,0,
		-1,0, 0,0, 0,1, 1,0,
		-1,0, 0,-1, 0,0, 0,1,
		-1,0, 0,-1, 0,0, 1,0
  ]);

  static byValue(value: number): Shape | null {
    return SHAPES.find(shape => shape.value === value) || null;
  }

  readonly value: number;
  private readonly _offsets: Coord[][];

  private constructor(value: number, offsets: number[]) {
    this.value = value;
    this._offsets = this.buildOffsets(offsets);
  }

  get numRotations(): number {
    return this._offsets.length;
  }

  getRotation(rotation: number): Coord[] {
    return this._offsets[ZMod.apply(rotation, this.numRotations)];
  }

  private buildOffsets(vals: number[]): Coord[][] {
		const numRotations = Math.floor(vals.length / 8);

    // initialize result double array
    const result = new Array<Coord[]>(numRotations);

    // iterate over rotations
    for (
      let rotationIndex = 0;
      rotationIndex < numRotations;
      rotationIndex++
    ) {
      // initialize result[rotationIndex] array
      result[rotationIndex] = new Array<Coord>(4);

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

export const SHAPES = [
  Shape.O,
  Shape.I,
  Shape.S,
  Shape.Z,
  Shape.L,
  Shape.J,
  Shape.T
];
