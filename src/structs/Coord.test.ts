import Coord from './Coord';

describe('Coord', () => {
  describe('static', () => {
    const expectFrozenAtCoord = (coord: Coord, row: number, col: number) => {
      expect(coord.row).toBe(row);
      expect(coord.col).toBe(col);
      expect(coord.isFrozen()).toBe(true);
      expect(() => {
        coord.row = 1;
      }).toThrowError();
      expect(() => {
        coord.col = 1;
      }).toThrowError();
    };

    describe('preset coords', () => {
      test('ZERO is frozen at (0, 0)', () => {
        expectFrozenAtCoord(Coord.ZERO, 0, 0);
      });

      test('RIGHT is frozen at (0, 1)', () => {
        expectFrozenAtCoord(Coord.RIGHT, 0, 1);
      });

      test('LEFT is frozen at (0, -1)', () => {
        expectFrozenAtCoord(Coord.LEFT, 0, -1);
      });

      test('DOWN is frozen at (1, 0)', () => {
        expectFrozenAtCoord(Coord.DOWN, 1, 0);
      });

      test('UP is frozen at (-1, 0)', () => {
        expectFrozenAtCoord(Coord.UP, -1, 0);
      });
    });

    describe('copy', () => {
      let other: Coord;

      beforeEach(() => {
        other = new Coord(1, 2);
      });

      test('returns a new Coord with the same row and col', () => {
        const coord = Coord.copy(other);
        expect(coord.row).toBe(1);
        expect(coord.col).toBe(2);

        // Should be a new object
        expect(coord).not.toBe(other);
      });
    });

    describe('copyAll', () => {
      let source: Coord[];

      beforeEach(() => {
        source = [
          new Coord(1, 2),
          new Coord(3, 4),
          new Coord(5, 6),
        ];
      });

      test('returns a new array with the same values', () => {
        jest.spyOn(Coord, 'copy');
        const copy = Coord.copyAll(source);
        expect(copy).toEqual(source);
        expect(Coord.copy).toHaveBeenCalledTimes(source.length);

        // Should be a new array
        expect(copy).not.toBe(source);
      });
    });

    describe('offsetAll', () => {
      let source: Coord[];

      beforeEach(() => {
        source = [
          new Coord(1, 2),
          new Coord(3, 4),
          new Coord(5, 6),
        ];
      });

      test('offsets all Coords in the array', () => {
        jest.spyOn(Coord.prototype, 'addCoord');
        Coord.offsetAll(source, Coord.UP);
        expect(source).toEqual([
          new Coord(0, 2),
          new Coord(2, 4),
          new Coord(4, 6),
        ]);
        expect(Coord.prototype.addCoord).toHaveBeenCalledTimes(source.length);
        [1, 2, 3].forEach((n, _i) => {
          expect(Coord.prototype.addCoord).toHaveBeenNthCalledWith(n, Coord.UP);
        });
      });

      test('returns the array', () => {
        expect(Coord.offsetAll(source, Coord.UP)).toBe(source);
      });
    });
  });

  let coord: Coord;

  beforeEach(() => {
    coord = new Coord(1, 2);
  });

  describe('constructor', () => {
    test('creates a Coord with the given row and col', () => {
      expect(coord.row).toBe(1);
      expect(coord.col).toBe(2);
      expect(coord.isFrozen()).toBe(false);
    });
  });

  describe('freeze', () => {
    test('makes the Coord unmodifiable', () => {
      expect(coord.isFrozen()).toBe(false);
      coord.freeze();
      expect(coord.isFrozen()).toBe(true);
      expect(() => {
        coord.row = 1;
      }).toThrowError();
      expect(() => {
        coord.col = 1;
      }).toThrowError();
    });

    test('deledates to super.freeze and returns the Coord', () => {
      jest.spyOn(Coord.prototype, 'freeze');
      expect(coord.freeze()).toBe(coord);
      expect(Coord.prototype.freeze).toHaveBeenCalledTimes(1);
    });

    test('does nothing if the Coord is already frozen', () => {
      coord.freeze();
      expect(coord.isFrozen()).toBe(true);
      expect(() => {
        coord.freeze();
      }).not.toThrowError();
      expect(coord.isFrozen()).toBe(true);
    });
  });

  describe('unfreeze', () => {
    test('throws an error', () => {
      expect(() => {
        coord.unfreeze();
      }).toThrowError();
    });
  });

  describe('get row', () => {
    test('returns the row coordinate', () => {
      expect(coord.row).toBe(1);
    });
  });

  describe('get col', () => {
    test('returns the column coordinate', () => {
      expect(coord.col).toBe(2);
    });
  });

  describe('set row', () => {
    test('sets the row coordinate', () => {
      coord.row = 3;
      expect(coord.row).toBe(3);
    });

    test('throws an error if the Coord is frozen', () => {
      expect(() => {
        coord.freeze().row = 3;
      }).toThrowError();
    });
  });

  describe('set col', () => {
    test('sets the column coordinate', () => {
      coord.col = 3;
      expect(coord.col).toBe(3);
    });

    test('throws an error if the Coord is frozen', () => {
      expect(() => {
        coord.freeze().col = 3;
      }).toThrowError();
    });
  });

  describe('reset', () => {
    test('sets the coordinates to the ones specified', () => {
      coord.reset({ row: 3, col: 4 });
      expect(coord.row).toBe(3);
      expect(coord.col).toBe(4);

      coord.reset(new Coord(5, 6));
      expect(coord.row).toBe(5);
      expect(coord.col).toBe(6);
    });

    test('returns the Coord', () => {
      expect(coord.reset({ row: 3, col: 4 })).toBe(coord);
    });

    test('throws an error if the Coord is frozen', () => {
      expect(() => {
        coord.freeze().reset({ row: 3, col: 4 });
      }).toThrowError();
    });
  });

  describe('addRow', () => {
    test('adds the given number to the row coordinate', () => {
      coord.addRow(3);
      expect(coord.row).toBe(4);
      expect(coord.col).toBe(2);
    });

    test('returns the Coord', () => {
      expect(coord.addRow(3)).toBe(coord);
    });

    test('throws an error if the Coord is frozen', () => {
      expect(() => {
        coord.freeze().addRow(3);
      }).toThrowError();
    });
  });

  describe('addCol', () => {
    test('adds the given number to the column coordinate', () => {
      coord.addCol(3);
      expect(coord.row).toBe(1);
      expect(coord.col).toBe(5);
    });

    test('returns the Coord', () => {
      expect(coord.addCol(3)).toBe(coord);
    });

    test('throws an error if the Coord is frozen', () => {
      expect(() => {
        coord.freeze().addCol(3);
      }).toThrowError();
    });
  });

  describe('addCoord', () => {
    let coords: Coord[];

    beforeEach(() => {
      coords = [
        new Coord(1, 2),
        new Coord(3, 4),
        new Coord(5, 6),
      ];
    });

    test('adds the given Coords to the current one', () => {
      coord.addCoord(...coords);
      expect(coord.row).toBe(10);
      expect(coord.col).toBe(14);
    });

    test('returns the Coord', () => {
      expect(coord.addCoord(...coords)).toBe(coord);
    });

    test('throws an error if the Coord is frozen', () => {
      expect(() => {
        coord.freeze().addCoord(...coords);
      }).toThrowError();
    });
  });

  describe('add', () => {
    test('adds the given Coord to the current one', () => {
      coord.add(new Coord(3, 4));
      expect(coord.row).toBe(4);
      expect(coord.col).toBe(6);
    });

    test('returns the Coord', () => {
      expect(coord.add(new Coord(3, 4))).toBe(coord);
    });

    test('throws an error if the Coord is frozen', () => {
      expect(() => {
        coord.freeze().add(new Coord(3, 4));
      }).toThrowError();
    });
  });

  describe('sqrDist', () => {
    test('returns the square distance between the two Coords', () => {
      expect(coord.sqrDist(new Coord(123, 456))).toBe(221000);
    });
  });

  describe('equals', () => {
    test('returns true if the two Coords have the same row and col', () => {
      expect(coord.equals(new Coord(1, 2))).toBe(true);
      expect(coord.equals(new Coord(1, 3))).toBe(false);
      expect(coord.equals(new Coord(2, 2))).toBe(false);
    });
  });
});
