import {
  BlockyState,
  Coord,
  Move,
  Piece,
  Position,
  BlockyShape as Shape,
  ZMod
} from '../../index.js';

describe('Piece', () => {
  /** @type {Piece} */
  let piece;
  /** @type {Shape} */
  let initialShape;
  /** @type {Coord} */
  let initialLocation;

  beforeEach(() => {
    initialShape = Shape.O;
    initialLocation = new Coord(0, 1);
    piece = new Piece(
      new Position(initialLocation, 0, initialShape.numRotations),
      initialShape
    );
  });

  describe('static copy', () => {
    it('returns a copy of the given piece', () => {
      const copy = Piece.copy(piece);
      expect(copy).toEqual(piece);
      expect(copy).not.toBe(piece);
    });
  });

  describe('constructor', () => {
    it('creates a new piece with the given location and shape', () => {
      expect(piece.shape).toBe(initialShape);
      expect(piece.position.location).toEqual(initialLocation);
      expect(piece.position.rotation).toBe(0);
      expect(piece.position.maxRotation).toBe(initialShape.numRotations);
      expect(piece.isActive).toBe(true);
      const expectedCoords = Coord.offsetAll(Coord.copyAll(initialShape.getRotation(0)), initialLocation);
      expect(piece.blockCoords).toEqual(expectedCoords);
    });
  });

  describe('reset', () => {
    it('resets the piece to the given location and shape', () => {
      const newShape = Shape.I;
      const newLocation = new Coord(1, 1);
      piece.reset(newLocation, newShape);
      expect(piece.shape).toBe(newShape);
      expect(piece.position.location).toEqual(newLocation);
      expect(piece.position.rotation).toBe(0);
      expect(piece.position.maxRotation).toBe(newShape.numRotations);
      expect(piece.isActive).toBe(true);
      const newCoords = Coord.offsetAll(Coord.copyAll(newShape.getRotation(0)), newLocation);
      expect(piece.blockCoords).toEqual(newCoords);
    });
  });

  describe('get shape', () => {
    it('returns the shape of the piece', () => {
      expect(piece.shape).toBe(initialShape);
    });
  });

  describe('set shape', () => {
    it('sets the shape of the piece and updates the block coordinates', () => {
      const newShape = Shape.I;
      piece.shape = newShape;
      expect(piece.shape).toBe(newShape);
      expect(piece.position.rotation).toBe(0);
      expect(piece.position.maxRotation).toBe(newShape.numRotations);
      const newCoords = Coord.offsetAll(Coord.copyAll(newShape.getRotation(0)), initialLocation);
      expect(piece.blockCoords).toEqual(newCoords);
    });
  });

  describe('get position', () => {
    it('returns the position of the piece', () => {
      expect(piece.position.location).toEqual(initialLocation);
      expect(piece.position.rotation).toBe(0);
      expect(piece.position.maxRotation).toBe(initialShape.numRotations);
    });
  });

  describe('get isActive', () => {
    it('returns whether the piece is active', () => {
      expect(piece.isActive).toBe(true);
    });
  });

  describe('get blockCoords', () => {
    it('returns the block coordinates of the piece', () => {
      const expectedCoords = Coord.offsetAll(Coord.copyAll(initialShape.getRotation(0)), initialLocation);
      expect(piece.blockCoords).toEqual(expectedCoords);
    });
  });

  describe('disable', () => {
    it('sets the piece as inactive', () => {
      piece.disable();
      expect(piece.isActive).toBe(false);
    });
  });

  describe('enable', () => {
    it('sets the piece as active', () => {
      piece.enable();
      expect(piece.isActive).toBe(true);
    });
  });

  describe('move', () => {
    it('moves the piece by the given amount', () => {
      const move = new Move({ row: 1, col: 1 }, 0);
      const expectedLocation = initialLocation.add(move.offset);
      piece.move(move);
      expect(piece.position.location).toEqual(expectedLocation);
      expect(piece.position.rotation).toBe(0);
    });

    it('rotates the piece by the given rotation', () => {
      const move = new Move({ row: 0, col: 0 }, 1);
      const expectedRotation = ZMod.apply(piece.position.rotation + move.rotation, piece.position.maxRotation);
      piece.move(move);
      expect(piece.position.location).toEqual(initialLocation);
      expect(piece.position.rotation).toBe(expectedRotation);
    });

    it('updates the block coordinates', () => {
      const move = new Move({ row: 1, col: 1 }, 1);
      const expectedLocation = initialLocation.add(move.offset);
      const expectedRotation = ZMod.apply(piece.position.rotation + move.rotation, piece.position.maxRotation);
      const expectedCoords = Coord.offsetAll(Coord.copyAll(initialShape.getRotation(expectedRotation)), expectedLocation);
      piece.move(move);
      expect(piece.position.location).toEqual(expectedLocation);
      expect(piece.position.rotation).toBe(expectedRotation);
      expect(piece.blockCoords).toEqual(expectedCoords);
    });
  });

  describe('intersects', () => {
    /** @type {BlockyState} */
    let state;

    beforeEach(() => {
      state = new BlockyState();
    });

    describe('when the piece does not overlap with any blocks', () => {
      it('returns false', () => {
        expect(piece.intersects(state)).toBe(false);
      });
    });

    describe('when the piece shares coordinates with a block', () => {
      it('returns true', () => {
        state.setCell(initialLocation, Shape.O.value);
        expect(piece.intersects(state)).toBe(true);
      });
    });
  });
});
