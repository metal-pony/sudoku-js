import { Event, EventListener } from './Event';
import IEventBussy from './IEventBussy';

/**
 * An EventBus contains a registry of event listeners that can be invoked by throwing events.
 */
export default class EventBus implements IEventBussy {
  private _listeners: { [eventName: string]: EventListener[] };

  /**
   * Creates a new EventBus with no listeners.
   */
  constructor() {
    this._listeners = {};
  }

  hasListeners(eventName: string): boolean {
    return eventName in this._listeners && this._listeners[eventName].length > 0;
  }

  registerEventListener(eventName: string, listener: EventListener): boolean {
    if (eventName in this._listeners) {
      this._listeners[eventName].push(listener);
    } else {
      this._listeners[eventName] = [listener];
    }

    return true;
  }

  unregisterEventListener(eventName: string, listener: EventListener): boolean {
    if (eventName in this._listeners) {
      const index = this._listeners[eventName].indexOf(listener);
      if (index >= 0) {
        this._listeners[eventName].splice(index, 1);
        return true;
      }
    }

    return false;
  }

  unregisterAllEventListeners(eventName: string): boolean {
    if (eventName in this._listeners) {
      if (this._listeners[eventName].length > 0) {
        this._listeners[eventName] = [];
        return true;
      }
    }

    return false;
  }

  throwEvent(event: Event): void {
    event.freeze();
    if (event.name in this._listeners) {
      this._listeners[event.name].forEach(listener => listener(event));
    }
  }
}
