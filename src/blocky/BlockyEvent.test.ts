import Blocky from "./Blocky";
import BlockyEvent from "./BlockyEvent";
import BlockyState from "./BlockyState";

describe('BlockyEvent', () => {
  let event: BlockyEvent;

  beforeEach(() => {
    event = new BlockyEvent('TEST');
  });

  describe('constructor', () => {
    test('creates an event with the given name and no extra data', () => {
      const event = new BlockyEvent('TEST');
      expect(event.name).toBe('TEST');
      expect(event.data).toEqual({});
    });

    test('creates an event with the given name and data', () => {
      const event = new BlockyEvent('TEST', { a: 1, b: 2 });
      expect(event.name).toBe('TEST');
      expect(event.data).toEqual({ a: 1, b: 2 });
    });
  });

  describe('add', () => {
    test('adds the given data to the event', () => {
      event.add({ a: 1, b: 2 });
      expect(event.data).toEqual({ a: 1, b: 2 });
    });

    test('overwrites existing data', () => {
      event.add({ a: 1, b: 2 });
      expect(event.data).toEqual({ a: 1, b: 2 });
      event.add({ b: 3 });
      expect(event.data).toEqual({ a: 1, b: 3 });
    });

    test('returns itself', () => {
      expect(event.add({})).toBe(event);
    });
  });

  describe('withState', () => {
    test('adds the given game state to the event', () => {
      const blocky = new Blocky();
      const state = new BlockyState();
      jest.spyOn(blocky, 'getState').mockReturnValue(state);

      event.withState(blocky);
      expect(event.data).toEqual({ state });
    });

    test('returns itself', () => {
      expect(event.withState(new Blocky())).toBe(event);
    });
  });

  describe('withPieceData', () => {
    test('adds the given piece data to the event', () => {
      const blocky = new Blocky();
      const state = new BlockyState();
      const piece = state.piece;
      jest.spyOn(blocky, 'getState').mockReturnValue(state);
      jest.spyOn(state, 'piece', 'get').mockReturnValue(piece);

      event.withPieceData(blocky);
      expect(event.data).toEqual({ _piece: piece });
    });

    test('returns itself', () => {
      expect(event.withPieceData(new Blocky())).toBe(event);
    });
  });
});
