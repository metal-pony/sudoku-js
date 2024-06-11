import { validateNonNegative, validatePositive } from './common';

export default class Timer {
  static get DEFAULT_DELAY_MS() { return 1000; }

  /**
   * @returns {number} The current time in milliseconds.
   */
  static _now() {
    return performance.now() || Date.now();
  }

  /**
   * Creates a new Timer with the given runnable.
   *
   * @param {(elapsed: number) => void} runnable The function to run on each tick.
   */
  constructor(runnable) {
    this._runnable = runnable;
    this._tickCount = 0;
    this._lastTick = 0;
    this._running = false;
    this._delay = Timer.DEFAULT_DELAY_MS;
    this._repeats = true;
    this._tickCallback = this._tick.bind(this);
  }

  /**
   * @param {number} timeStamp
   */
  _tick(timeStamp) {
    if (!this.isRunning) {
      return;
    }

    if (this._lastTick <= 0) {
      this._lastTick = timeStamp;
    }

    const elapsedTime = timeStamp - this._lastTick;

    if (elapsedTime >= this._delay) {
      this._lastTick += this._delay;
      this._tickCount++;
      this._runnable(elapsedTime);
    }

    if (this._repeats || this._tickCount < 1) {
      requestAnimationFrame(this._tickCallback);
      return;
    }

    this.stop();
  }

  /**
   * Gets whether the timer is currently running.
   */
  get isRunning() {
    return this._running;
  }

  /**
   * Gets the time in milliseconds between ticks.
   */
  get delay() {
    return this._delay;
  }

  /**
   * Sets the time in milliseconds between ticks.
   */
  set delay(delayMs) {
    this._delay = validatePositive(delayMs, 'delay');
  }

  /**
   * Gets the function that is run on each tick.
   */
  get runnable() {
    return this._runnable;
  }

  /**
   * Sets the function that is run on each tick.
   * @param {(elapsed: number) => void} runnable The function to run on each tick.
   * @throws If the timer is currently running.
   */
  set runnable(runnable) {
    if (this.isRunning) {
      throw new Error('Cannot set runnable while timer is running');
    }

    this._runnable = runnable;
  }

  /**
   * Delays the next tick by the given number of milliseconds.
   * @param {number} delayMs The number of milliseconds to delay the next tick.
   * Defaults to {@link Timer.DEFAULT_DELAY_MS}.
   */
  delayNextTick(delayMs = this.delay) {
    this._lastTick = Timer._now() + delayMs;
  }

  /**
   * Stops the timer.
   */
  stop() {
    this._running = false;
  }

  /**
   * Starts the timer.
   * If the timer is already running, this method does nothing.
   *
   * @param {number} delayMs (default: last delay used or {@link Timer.DEFAULT_DELAY_MS}) The number of milliseconds between ticks.
   * @param {number} initialDelayMs (default: last delay used or {@link Timer.DEFAULT_DELAY_MS}) The number of milliseconds to wait before the first tick.
   * @param {boolean} repeats (default: true) Whether the timer should repeat after the first tick.
   * @throws If initialDelayMs is negative or delayMs is not positive.
   */
  start(
    delayMs = this._delay,
    initialDelayMs = this._delay,
    repeats = true
  ) {
    validateNonNegative(initialDelayMs, 'initialDelayMs');

    if (this.isRunning) {
      return;
    }

    // Handles validation of delay
    this.delay = delayMs;

    this._repeats = repeats;
    this._tickCount = 0;
    this._lastTick = 0;
    this._running = true;
    const nextTick = (
      Timer._now() +
      (initialDelayMs >= 0 ? initialDelayMs : delayMs)
    );
    this._tick(nextTick);
  }
}
