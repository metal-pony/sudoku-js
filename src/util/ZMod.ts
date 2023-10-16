import { validateInteger, validatePositiveInteger } from "./Util";

export default class ZMod {
  /**
   * Returns the value modulo mod.
   */
  static apply(value: number, mod: number): number {
    validatePositiveInteger(mod, 'mod');
    return ((validateInteger(value, 'value') % mod) + mod) % mod;
  }

  private _value: number = 0;
  readonly mod: number;

  /**
   * Creates a new ZMod with the given value and mod.
   */
  constructor(value: number, mod: number) {
    this.mod = validatePositiveInteger(mod, 'mod');
    this.set(value);
  }

  /**
   * Returns the value of this ZMod.
   */
  get(): number {
    return this._value;
  }

  /**
   * Sets the value of this ZMod.
   *
   * @returns This ZMod.
   */
  set(value: number): ZMod {
    this._value = ((validateInteger(value, 'value') % this.mod) + this.mod) % this.mod;
    return this;
  }

  /**
   * Adds the given value to this ZMod.
   *
   * @returns This ZMod.
   */
  add(value: number): ZMod {
    return this.set(this._value + value);
  }

  /**
   * Subtracts the given value from this ZMod.
   *
   * @returns This ZMod.
   */
  subtract(value: number): ZMod {
    return this.set(this._value - value);
  }
}
