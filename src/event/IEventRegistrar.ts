import { EventListener } from "./Event";

export default interface IEventRegistrar {
  /**
   * Registers the given listener for the given event.
   *
   * @param eventName The name of the event to listen for.
   * @param listener The listener to register.
   * @returns True if the listener was registered; otherwise false.
   */
  registerEventListener(eventName: string, listener: EventListener): boolean;

  /**
   * Unregisters the given listener for the given event.
   *
   * @param eventName The name of the event to unregister from.
   * @param listener The listener to unregister.
   * @returns True if the listener was unregistered; otherwise false.
   */
  unregisterEventListener(eventName: string, listener: EventListener): boolean;

  /**
   * Unregisters all listeners for the given event.
   *
   * @param eventName The name of the event to unregister from.
   * @returns True if any listeners were unregistered; otherwise false.
   */
  unregisterAllEventListeners(eventName: string): boolean;

  /**
   * Checks if the given event has any registered listeners.
   *
   * @param eventName The event to check.
   * @returns True if the event has listeners; otherwise false.
   */
  hasListeners(eventName: string): boolean;
};
