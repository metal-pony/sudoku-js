import { validateInteger, validatePositiveInteger } from './common.js';

export default class ZMod {
  /**
   * Returns the value modulo mod.
   * @param {number} value
   * @param {number} mod
   * @returns {number}
   */
  static apply(value, mod) {
    validatePositiveInteger(mod, 'mod');
    return ((validateInteger(value, 'value') % mod) + mod) % mod;
  }

  /**
   * Creates a new ZMod with the given value and mod.
   * @param {number} value
   * @param {number} mod
   */
  constructor(value, mod) {
    /** @type {number} */
    this.mod = validatePositiveInteger(mod, 'mod');
    this._value = 0;
    this.set(value);
  }

  /**
   * Returns the value of this ZMod.
   * @returns {number}
   */
  get() {
    return this._value;
  }

  /**
   * Sets the value of this ZMod.
   * @returns {ZMod}
   */
  set(value) {
    this._value = ((validateInteger(value, 'value') % this.mod) + this.mod) % this.mod;
    return this;
  }

  /**
   * Adds the given value to this ZMod.
   * @returns {ZMod}
   */
  add(value) {
    return this.set(this._value + value);
  }

  /**
   * Subtracts the given value from this ZMod.
   * @returns {ZMod}
   */
  subtract(value) {
    return this.set(this._value - value);
  }
}
