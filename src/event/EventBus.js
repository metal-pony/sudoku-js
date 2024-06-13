import Event from './Event.js';

/**
 * An EventBus contains a registry of event listeners that can be invoked by throwing events.
 */
export default class EventBus {
  /**
   * Creates a new EventBus with no listeners.
   */
  constructor() {
    /** @type {{[key][]}} */
    this._listeners = {};
  }

  /**
   * Checks if the given event has any registered listeners.
   * @param {string} eventName The event to check.
   * @returns {boolean} True if the event has listeners; otherwise false.
   */
  hasListeners(eventName) {
    return eventName in this._listeners && this._listeners[eventName].length > 0;
  }

  /**
   * Registers the given listener for the given event.
   * @param {string} eventName The name of the event to listen for.
   * @param {(Event) => void} listener The listener to register.
   * @returns {boolean} True if the listener was registered; otherwise false.
   */
  registerEventListener(eventName, listener) {
    if (eventName in this._listeners) {
      this._listeners[eventName].push(listener);
    } else {
      this._listeners[eventName] = [listener];
    }
    return true;
  }

  /**
   * Unregisters the given listener for the given event.
   * @param {string} eventName The name of the event to unregister from.
   * @param {(Event) => void} listener The listener to unregister.
   * @returns {boolean} True if the listener was unregistered; otherwise false.
   */
  unregisterEventListener(eventName, listener) {
    if (eventName in this._listeners) {
      const index = this._listeners[eventName].indexOf(listener);
      if (index >= 0) {
        this._listeners[eventName].splice(index, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Unregisters all listeners for the given event.
   * @param {string} eventName The name of the event to unregister from.
   * @returns {boolean} True if any listeners were unregistered; otherwise false.
   */
  unregisterAllEventListeners(eventName) {
    if (eventName in this._listeners) {
      if (this._listeners[eventName].length > 0) {
        this._listeners[eventName] = [];
        return true;
      }
    }
    return false;
  }

  /**
   * Throws the given event to all registered listeners.
   * The given event will be frozen so that listeners or the thrower cannot further modify it.
   * @param {Event} event The event to throw.
   */
  throwEvent(event) {
    event.freeze();
    if (event.name in this._listeners) {
      this._listeners[event.name].forEach(listener => listener(event));
    }
  }
}
