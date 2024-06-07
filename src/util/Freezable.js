export default class Freezable {
  constructor() {
    /** @type {boolean} */
    this._frozen = false;
  }

  /** Gets whether this object is frozen. */
  isFrozen() { return this._frozen; }

  /**
   * Freezes this object.
   * @returns Itself for convenience.
   */
  freeze() {
    this._frozen = true;
    return this;
  }

  /**
   * Unfreezes this object.
   * @returns Itself for convenience.
   */
  unfreeze() {
    this._frozen = false;
    return this;
  }

  /**
   * Throws an error if this object is frozen.
   */
  throwIfFrozen() {
    if (this.isFrozen()) {
      throw new Error('Object is frozen.');
    }
  }
}
