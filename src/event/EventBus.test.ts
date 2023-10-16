import { Event } from "./Event";
import EventBus from "./EventBus";

describe('EventBus', () => {
  let eventBus: EventBus;
  let mockListener: jest.Mock;

  beforeEach(() => {
    eventBus = new EventBus();
    mockListener = jest.fn();
  });

  describe('hasListeners', () => {
    test('returns false if the event has no listeners', () => {
      expect(eventBus.hasListeners('test')).toEqual(false);
    });

    test('returns true if the event has listeners', () => {
      eventBus.registerEventListener('test', mockListener);
      expect(eventBus.hasListeners('test')).toEqual(true);
    });
  });

  describe('registerEventListener', () => {
    test('registers an event listener', () => {
      eventBus.registerEventListener('test', mockListener);
      expect(eventBus.hasListeners('test')).toEqual(true);
    });

    test('returns true', () => {
      expect(eventBus.registerEventListener('test', mockListener)).toEqual(true);
    });
  });

  describe('unregisterEventListener', () => {
    test('unregisters an event listener', () => {
      eventBus.registerEventListener('test', mockListener);
      eventBus.unregisterEventListener('test', mockListener);
      expect(eventBus.hasListeners('test')).toEqual(false);
    });

    test('returns true if a listener was unregistered', () => {
      eventBus.registerEventListener('test', mockListener);
      expect(eventBus.unregisterEventListener('test', mockListener)).toEqual(true);
    });

    test('returns false if a listener was not unregistered', () => {
      expect(eventBus.unregisterEventListener('test', mockListener)).toEqual(false);
    });
  });

  describe('unregisterAllEventListeners', () => {
    test('unregisters all event listeners', () => {
      eventBus.registerEventListener('test', mockListener);
      eventBus.unregisterAllEventListeners('test');
      expect(eventBus.hasListeners('test')).toEqual(false);
    });

    test('returns true if any listeners were unregistered', () => {
      eventBus.registerEventListener('test', mockListener);
      expect(eventBus.unregisterAllEventListeners('test')).toEqual(true);
    });

    test('returns false if no listeners were unregistered', () => {
      expect(eventBus.unregisterAllEventListeners('test')).toEqual(false);
    });
  });

  describe('throwEvent', () => {
    let event: Event;

    beforeEach(() => {
      event = new Event('test');
      eventBus.registerEventListener(event.name, mockListener);
    });

    test('calls all listeners for the given event', () => {
      eventBus.throwEvent(event);
      expect(mockListener).toHaveBeenCalledWith(event);
    });

    test('does not call listeners for other events', () => {
      eventBus.throwEvent(new Event('other'));
      expect(mockListener).not.toHaveBeenCalled();
    });

    test('freezes the given event', () => {
      expect(event.isFrozen()).toEqual(false);
      eventBus.throwEvent(event);
      expect(event.isFrozen()).toEqual(true);
    });
  });
});
