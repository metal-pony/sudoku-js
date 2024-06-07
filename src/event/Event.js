import Freezable from "../util/Freezable";

/**
 * An Event is a named object that may contain data to be consumed by listeners.
 */
export default class Event extends Freezable {
  /**
   * Creates a new Event with the given name and optional data.
   * @param {string} name The name of the event.
   * @param {object} data Optional data for the event.
   */
  constructor(name, data = {}) {
    super();
    this.name = name;
    /** @type {Object} */
    this._data = Object.assign({}, data);
  }

  /** @throws {Error} Operation not supported.*/
	unfreeze() {
		throw new Error("Operation not supported.");
	}

  /**
   * Returns this event's data.
   * @type {Object}
   */
  get data() {
    return this._data;
  }

  /**
   * Adds the given data to the event.
   * @param {object} data An object containing the data to add.
   * @returns {Event} This Event.
   */
  add(data) {
    this.throwIfFrozen();
    Object.assign(this._data, data);
    return this;
  }

  /**
   * Returns true if the event has the given data key.
   * @param {string} key The data key to check.
   * @returns {boolean} True if the event has the given data key; false otherwise.
   */
  hasData(key) {
    return Object.hasOwn(this._data, key);
  }
}
