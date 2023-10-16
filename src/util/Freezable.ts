import IFreezable from "./IFreezable";

export default class Freezable implements IFreezable {
  protected readonly ERR_FROZEN: string = 'Object is frozen.';

  protected _frozen: boolean;

  constructor() {
    this._frozen = false;
  }

  isFrozen(): boolean {
    return this._frozen;
  }

  freeze(): Freezable {
    this._frozen = true;
    return this;
  }

  unfreeze(): Freezable {
    this._frozen = false;
    return this;
  }

  throwIfFrozen(): void {
    if (this.isFrozen()) {
      throw new Error(this.ERR_FROZEN);
    }
  }
}
