import Coord from "../structs/Coord";
import Move from "../structs/Move";
import Position from "./Position";

describe('Position', () => {
  let position: Position;

  beforeEach(() => {
    position = new Position(new Coord(1, 2), 3, 4);
  });

  describe('static', () => {
    describe('copy', () => {
      test('copies the given Position', () => {
        expect(Position.copy(position)).toEqual(position);

        // Should be a new object
        expect(Position.copy(position)).not.toBe(position);
      });
    });
  });

  describe('constructor', () => {
    test('sets location, rotation, and maxRotation', () => {
      expect(position.location).toEqual(new Coord(1, 2));
      expect(position.rotation).toBe(3);
      expect(position.maxRotation).toBe(4);
      expect(position.isFrozen()).toBe(false);
    });

    describe('when rotation >= maxRotation', () => {
      test('normalizes rotation to be within the maximum', () => {
        expect(new Position(new Coord(1, 2), 5, 4).rotation).toBe(1);
      });
    });

    describe('when maxRotation is not a positive integer', () => {
      test('throws an error', () => {
        expect(() => new Position(new Coord(1, 2), 3, 0)).toThrow();
        expect(() => new Position(new Coord(1, 2), 3, -1)).toThrow();
        expect(() => new Position(new Coord(1, 2), 3, 1.5)).toThrow();
      });
    });
  });

  describe('freeze', () => {
    test('delegates to super.freeze and returns itself', () => {
      jest.spyOn(Position.prototype, 'freeze');
      expect(position.freeze()).toBe(position);
      expect(Position.prototype.freeze).toHaveBeenCalledTimes(1);
    });
  });

  describe('get location', () => {
    test('returns the location', () => {
      expect(position.location).toEqual(new Coord(1, 2));
    });
  });

  describe('get maxRotation', () => {
    test('returns the maxRotation', () => {
      expect(position.maxRotation).toBe(4);
    });
  });

  describe('set rotation', () => {
    test('sets the rotation', () => {
      position.rotation = 2;
      expect(position.rotation).toBe(2);
    });

    describe('when frozen', () => {
      test('throws an error', () => {
        expect(() => position.freeze().rotation = 5).toThrow();
      });
    });

    describe('when rotation >= maxRotation', () => {
      test('normalizes rotation to be within the maximum', () => {
        position.rotation = 7;
        expect(position.rotation).toBe(3);
      });
    });
  });

  describe('set maxRotation', () => {
    test('sets the maxRotation', () => {
      position.maxRotation = 5;
      expect(position.maxRotation).toBe(5);
    });

    describe('when frozen', () => {
      test('throws an error', () => {
        expect(() => position.freeze().maxRotation = 5).toThrow();
      });
    });

    describe('when maxRotation is not a positive integer', () => {
      test('throws an error', () => {
        expect(() => position.maxRotation = 0).toThrow();
        expect(() => position.maxRotation = -1).toThrow();
        expect(() => position.maxRotation = 1.5).toThrow();
      });
    });

    describe('when rotation >= new maxRotation', () => {
      test('normalizes rotation to be within the maximum', () => {
        position.maxRotation = 2;
        expect(position.rotation).toBe(1);
      });
    });
  });

  describe('add', () => {
    test('adds the given Move', () => {
      position.add(new Move(new Coord(3, 4), -1));
      expect(position.location).toEqual(new Coord(4, 6));
      expect(position.rotation).toBe(2);
    });

    describe('when rotation >= maxRotation', () => {
      test('normalizes rotation to be within the maximum', () => {
        position.add(new Position(new Coord(3, 4), 5, 7));
        expect(position.rotation).toBe(0);
      });
    });

    describe('when frozen', () => {
      test('throws an error', () => {
        expect(() => position.freeze().add(new Position(new Coord(3, 4), 5, 6))).toThrow();
      });
    });
  });

  describe('rotate', () => {
    test('adds the given rotation and normalizes', () => {
      position.rotate(-1);
      expect(position.rotation).toBe(2);
    });

    describe('when rotation >= maxRotation', () => {
      test('normalizes rotation to be within the maximum', () => {
        position.rotate(2);
        expect(position.rotation).toBe(1);
      });
    });

    describe('when frozen', () => {
      test('throws an error', () => {
        expect(() => position.freeze().rotate(5)).toThrow();
      });
    });
  });

  describe('rotateClockwise', () => {
    test('subtracts 1 and normalizes', () => {
      position.rotateClockwise();
      expect(position.rotation).toBe(2);

      position.rotation = 0;
      position.rotateClockwise();
      expect(position.rotation).toBe(3);
    });

    describe('when frozen', () => {
      test('throws an error', () => {
        expect(() => position.freeze().rotateClockwise()).toThrow();
      });
    });
  });

  describe('rotateCounterClockwise', () => {
    test('adds 1 and normalizes', () => {
      position.rotation = 1;
      position.rotateCounterClockwise();
      expect(position.rotation).toBe(2);

      position.rotation = 3;
      position.rotateCounterClockwise();
      expect(position.rotation).toBe(0);
    });

    describe('when frozen', () => {
      test('throws an error', () => {
        expect(() => position.freeze().rotateCounterClockwise()).toThrow();
      });
    });
  });

  describe('equals', () => {
    test('returns true if the locations, rotations, and maxRotations are equal', () => {
      expect(position.equals(new Position(new Coord(1, 2), 3, 4))).toBe(true);
    });

    test('returns false if the locations are not equal', () => {
      expect(position.equals(new Position(new Coord(2, 2), 3, 4))).toBe(false);
    });

    test('returns false if the rotations are not equal', () => {
      expect(position.equals(new Position(new Coord(1, 2), 4, 4))).toBe(false);
    });

    test('returns false if the maxRotations are not equal', () => {
      expect(position.equals(new Position(new Coord(1, 2), 3, 5))).toBe(false);
    });
  });
});
