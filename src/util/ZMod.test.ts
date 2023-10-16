import ZMod from "./ZMod";

describe("ZMod", () => {
  let zmod: ZMod;

  beforeEach(() => {
    zmod = new ZMod(0, 3);
  });

  describe('static apply', () => {
    describe('when value is not an integer', () => {
      it('throws an error', () => {
        expect(() => ZMod.apply(1.5, 3)).toThrow();
      });
    });

    describe('when mod is not a positive integer', () => {
      it('throws an error', () => {
        expect(() => ZMod.apply(1, 0)).toThrow();
        expect(() => ZMod.apply(1, -1)).toThrow();
        expect(() => ZMod.apply(1, 1.5)).toThrow();
      });
    });

    describe('when value is an integer and mod is a positive integer', () => {
      it('returns the value modulo mod', () => {
        for(let mod = 1; mod < 10; mod++) {
          for(let value = -10; value < 10; value++) {
            expect(ZMod.apply(value, mod)).toBe(((value % mod) + mod) % mod);
          }
        }
      });
    });
  });

  describe('constructor', () => {
    describe('when mod is not a positive integer', () => {
      it('throws an error', () => {
        const badMods = [0, -1, 1.5];
        for(const badMod of badMods) {
          expect(() => new ZMod(0, badMod)).toThrow();
        }
      });
    });

    describe('when mod is a positive integer', () => {
      it('sets the mod', () => {
        for(let mod = 1; mod < 10; mod++) {
          expect(new ZMod(0, mod).mod).toBe(mod);
        }
      });

      describe('when value is not an integer', () => {
        it('throws an error', () => {
          const badValues = [1.5, -1.5];
          for(const badValue of badValues) {
            expect(() => new ZMod(badValue, 3)).toThrow();
          }
        });
      });

      describe('when value is an integer', () => {
        it('sets the value', () => {
          for(let mod = 1; mod < 10; mod++) {
            for(let value = -10; value < 10; value++) {
              expect(new ZMod(value, mod).get()).toBe(((value % mod) + mod) % mod);
            }
          }
        });
      });
    });
  });

  describe('get', () => {
    it('returns the value', () => {
      expect(zmod.get()).toBe(0);
      expect(new ZMod(1, 3).get()).toBe(1);
      expect(new ZMod(2, 3).get()).toBe(2);
      expect(new ZMod(3, 3).get()).toBe(0);
    });
  });

  describe('set', () => {
    describe('when value is not an integer', () => {
      it('throws an error', () => {
        const badValues = [1.5, -1.5];
        for(const badValue of badValues) {
          expect(() => zmod.set(badValue)).toThrow();
        }
      });
    });

    describe('when value is an integer', () => {
      it('sets the value', () => {
        for(let mod = 1; mod < 10; mod++) {
          for(let value = -10; value < 10; value++) {
            expect(new ZMod(0, mod).set(value).get()).toBe(((value % mod) + mod) % mod);
          }
        }
      });
    });
  });

  describe('add', () => {
    let value: number;

    beforeEach(() => {
      value = 10;
    });

    it('calls set with the current value plus the given value', () => {
      jest.spyOn(zmod, 'set');
      const currentValue = zmod.get();
      zmod.add(value);
      expect(zmod.set).toHaveBeenCalledWith(currentValue + value);
    });

    it('returns the result of set', () => {
      const returnValue: ZMod = new ZMod(2, 4);
      jest.spyOn(zmod, 'set').mockReturnValue(returnValue);
      expect(zmod.add(value)).toBe(returnValue);
    });
  });

  describe('subtract', () => {
    let value: number;

    beforeEach(() => {
      value = 10;
    });

    it('calls set with the current value minus the given value', () => {
      jest.spyOn(zmod, 'set');
      const currentValue = zmod.get();
      zmod.subtract(value);
      expect(zmod.set).toHaveBeenCalledWith(currentValue - value);
    });

    it('returns the result of set', () => {
      const returnValue: ZMod = new ZMod(2, 4);
      jest.spyOn(zmod, 'set').mockReturnValue(returnValue);
      expect(zmod.subtract(value)).toBe(returnValue);
    });
  });
});
