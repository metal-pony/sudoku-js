import { Event } from "./Event";

describe('Event', () => {
  let eventName: string;
  let event: Event;

  beforeEach(() => {
    eventName = 'test';
    event = new Event(eventName);
  });

  test('has a name', () => {
    expect(event.name).toEqual(eventName);
  });

  test('has no data by default', () => {
    expect(event.data).toEqual({});
  });

  describe('freeze', () => {
    test('delegates to super.freeze and returns itself', () => {
      jest.spyOn(Event.prototype, 'freeze');

      expect(event.freeze()).toBe(event);
      expect(Event.prototype.freeze).toHaveBeenCalledTimes(1);
    });
  });

  describe('unfreeze', () => {
    test('throws an error', () => {
      expect(() => {
        event.unfreeze();
      }).toThrowError();
    });
  });

  describe('get data', () => {
    test('returns a copy of the data', () => {
      event.add({ a: 1 });
      expect(event.data).toEqual({ a: 1 });
    });
  });

  describe('add', () => {
    describe('when the event is not frozen', () => {
      test('does not throw an error', () => {
        expect(() => {
          event.add({ a: 1 });
        }).not.toThrowError();
      });

      test('adds data to the event', () => {
        event.add({ a: 1 });
        expect(event.data).toEqual({ a: 1 });
      });

      test('overwrites existing data', () => {
        event.add({ a: 1 });
        event.add({ a: 2 });
        expect(event.data).toEqual({ a: 2 });
      });
    });

    describe('when the event is frozen', () => {
      test('throws an error', () => {
        expect(() => {
          event.freeze().add({ a: 1 });
        }).toThrowError();
      });
    });
  });

  describe('hasData', () => {
    test('returns true if the event has the given data', () => {
      event.add({ a: 1 });
      expect(event.hasData('a')).toEqual(true);
    });

    test('returns false if the event does not have the given data', () => {
      expect(event.hasData('a')).toEqual(false);
    });
  });
});
