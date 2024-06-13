import {jest} from '@jest/globals';
import { Coord, Move } from '../../index.js';

describe('Move', () => {
  /** @type {Move} */
  let move;

  beforeEach(() => {
    move = new Move(new Coord(1, 2), 3);
  });

  describe('static', () => {
    /**
     *
     * @param {Move} move
     * @param {number} row
     * @param {number} col
     * @param {number} rotation
     */
    const expectFrozenWithProps = (move, row, col, rotation) => {
      expect(move.row).toBe(row);
      expect(move.col).toBe(col);
      expect(move.rotation).toBe(rotation);
      expect(move.isFrozen()).toBe(true);
    };

    describe('preset Moves', () => {
      test('STAND is frozen at (0, 0), rotation 0', () => expectFrozenWithProps(Move.STAND, 0, 0, 0));
      test('RIGHT is frozen at (0, 1), rotation 0', () => expectFrozenWithProps(Move.RIGHT, 0, 1, 0));
      test('LEFT is frozen at (0, -1), rotation 0', () => expectFrozenWithProps(Move.LEFT, 0, -1, 0));
      test('DOWN is frozen at (1, 0), rotation 0', () => expectFrozenWithProps(Move.DOWN, 1, 0, 0));
      test('UP is frozen at (-1, 0), rotation 0', () => expectFrozenWithProps(Move.UP, -1, 0, 0));
      test('CLOCKWISE is frozen at (0, 0), rotation -1', () => expectFrozenWithProps(Move.CLOCKWISE, 0, 0, -1));
      test('COUNTERCLOCKWISE is frozen at (0, 0), rotation 1', () => expectFrozenWithProps(Move.COUNTERCLOCKWISE, 0, 0, 1));
    });

    describe('copy', () => {
      /** @type {Move} */
      let other;

      beforeEach(() => {
        other = new Move({ row: 1, col: 2 }, 3);
      });

      test('returns a new Move with the same row, col, and rotation', () => {
        const move = Move.copy(other);
        expect(move.row).toBe(1);
        expect(move.col).toBe(2);
        expect(move.rotation).toBe(3);

        // Should be a new object
        expect(move).not.toBe(other);
      });

      test('does not copy frozen status', () => {
        expect(Move.copy(other.freeze()).isFrozen()).toBe(false);
      });
    });
  });

  describe('constructor', () => {
    test('sets row, col, and rotation', () => {
      expect(move.row).toBe(1);
      expect(move.col).toBe(2);
      expect(move.rotation).toBe(3);
      expect(move.isFrozen()).toBe(false);
    });
  });

  describe('freeze', () => {
    test('calls freeze on the offset', () => {
      jest.spyOn(move.offset, 'freeze');
      move.freeze();
      expect(move.offset.isFrozen()).toBe(true);
      expect(move.offset.freeze).toHaveBeenCalledTimes(1);
    });

    test('delegates to super.freeze and returns itself', () => {
      jest.spyOn(Move.prototype, 'freeze');
      expect(move.freeze()).toBe(move);
      expect(Move.prototype.freeze).toHaveBeenCalledTimes(1);
    });
  });

  describe('get offset', () => {
    test('returns the offset', () => {
      expect(move.offset).toEqual(new Coord(1, 2));
    });
  });

  describe('get row', () => {
    test('returns the row coordinate', () => {
      expect(move.row).toBe(1);
    });
  });

  describe('get col', () => {
    test('returns the column coordinate', () => {
      expect(move.col).toBe(2);
    });
  });

  describe('get rotation', () => {
    test('returns the rotation', () => {
      expect(move.rotation).toBe(3);
    });
  });

  describe('set row', () => {
    test('sets the row coordinate', () => {
      move.row = 4;
      expect(move.row).toBe(4);
    });

    test('throws an error if frozen', () => {
      expect(() => {
        move.freeze().row = 4;
      }).toThrowError();
    });
  });

  describe('set col', () => {
    test('sets the column coordinate', () => {
      move.col = 4;
      expect(move.col).toBe(4);
    });

    test('throws an error if frozen', () => {
      expect(() => {
        move.freeze().col = 4;
      }).toThrowError();
    });
  });

  describe('set rotation', () => {
    test('sets the rotation', () => {
      move.rotation = 4;
      expect(move.rotation).toBe(4);
    });

    test('throws an error if frozen', () => {
      expect(() => {
        move.freeze().rotation = 4;
      }).toThrowError();
    });
  });

  describe('set', () => {
    /** @type {Coord} */
    let offset;
    /** @type {number} */
    let rotation = 0;

    beforeEach(() => {
      offset = new Coord(4, 5);
      rotation = 6;
    });

    test('sets the offset and rotation', () => {
      move.set(offset, rotation);
      expect(move.offset).toEqual(offset);
      expect(move.offset).not.toBe(offset);
      expect(move.rotation).toBe(rotation);
    });

    test('returns itself', () => {
      expect(move.set(offset, rotation)).toBe(move);
    });

    test('throws an error if frozen', () => {
      expect(() => {
        move.freeze().set(offset, rotation);
      }).toThrowError();
    });
  });

  describe('shift', () => {
    test('adds the offset', () => {
      move.shift(new Coord(1, 2));
      expect(move.offset).toEqual(new Coord(2, 4));
    });

    test('returns itself', () => {
      expect(move.shift(new Coord(1, 2))).toBe(move);
    });

    test('throws an error if frozen', () => {
      expect(() => {
        move.freeze().shift(new Coord(1, 2));
      }).toThrowError();
    });
  });

  describe('add', () => {
    /** @type {Move} */
    let other;

    beforeEach(() => {
      other = new Move(new Coord(1, 2), 3);
    });

    test('adds the offset and rotation', () => {
      move.add(other);
      expect(move.offset).toEqual(new Coord(2, 4));
      expect(move.rotation).toBe(6);
    });

    test('returns itself', () => {
      expect(move.add(other)).toBe(move);
    });

    test('throws an error if frozen', () => {
      expect(() => {
        move.freeze().add(other);
      }).toThrowError();
    });
  });

  describe('rotate', () => {
    test('adds the rotation', () => {
      move.rotate(5);
      expect(move.rotation).toBe(8);
    });

    test('returns itself', () => {
      expect(move.rotate(5)).toBe(move);
    });

    test('throws an error if frozen', () => {
      expect(() => {
        move.freeze().rotate(5);
      }).toThrowError();
    });
  });

  describe('rotateClockwise', () => {
    test('calls rotate with Move CLOCKWISE rotation', () => {
      const spy = jest.spyOn(move, 'rotate');
      move.rotateClockwise();
      expect(spy).toHaveBeenCalledWith(Move.CLOCKWISE.rotation);
    });
  });

  describe('rotateCounterClockwise', () => {
    test('calls rotate with Move COUNTERCLOCKWISE rotation', () => {
      const spy = jest.spyOn(move, 'rotate');
      move.rotateCounterClockwise();
      expect(spy).toHaveBeenCalledWith(Move.COUNTERCLOCKWISE.rotation);
    });
  });

  describe('sqrDist', () => {
    test('returns the square distance between the two offsets', () => {
      expect(move.sqrDist(new Move(new Coord(123, 654), 0))).toBe(439988);
    });
  });

  describe('equals', () => {
    test('returns true if the offsets and rotations are equal', () => {
      expect(move.equals(new Move(new Coord(1, 2), 3))).toBe(true);
    });

    test('returns false if the offsets are not equal', () => {
      expect(move.equals(new Move(new Coord(1, 3), 3))).toBe(false);
    });

    test('returns false if the rotations are not equal', () => {
      expect(move.equals(new Move(new Coord(1, 2), 2))).toBe(false);
    });
  });
});
