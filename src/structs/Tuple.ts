import Freezable from "../util/Freezable";

export default class Tuple<T> extends Freezable {
  private _values: T[];

  constructor(values: T[]) {
    super();
    this._values = values.slice(0, 2);
  }

  get values(): T[] {
    return this._values;
  }

  set values(values: T[]) {
    this.throwIfFrozen();
    this._values = values;
  }

  toString() {
    return `${this.isFrozen() ? 'F' : ''}(${this.values.join(', ')})`;
  }

  equals(other: Tuple<T>): boolean {
    return this.values.every((value, i) => value === other.values[i]);
  }
}
