import { Event } from "./Event";
import IEventRegistrar from "./IEventRegistrar";

export default interface IEventBussy extends IEventRegistrar {
  /**
   * Throws the given event to all registered listeners.
   * The given event will be frozen so that listeners or the thrower cannot further modify it.
   *
   * @param event The event to throw.
   */
  throwEvent(event: Event): void;
};
