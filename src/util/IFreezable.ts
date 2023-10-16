export default interface IFreezable {
  /**
   * Gets whether this object is frozen.
   */
  isFrozen(): boolean;

  /**
   * Freezes this object.
   *
   * @returns Itself for convenience.
   */
  freeze(): IFreezable;

  /**
   * Unfreezes this object.
   *
   * @returns Itself for convenience.
   */
  unfreeze(): IFreezable;

  /**
   * Throws an error if this object is frozen.
   */
  throwIfFrozen(): void;
}
