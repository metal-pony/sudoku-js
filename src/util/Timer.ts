import { validateNonNegative, validatePositive } from "./Util";

export default class Timer {
  static readonly DEFAULT_DELAY_MS = 1000;

  private static _now(): number {
    return performance.now() || Date.now();
  }

  private _tickCount: number = 0;
  private _lastTick: number = 0;
  private _running: boolean = false;
  private _delay: number = Timer.DEFAULT_DELAY_MS;
  private _repeats: boolean = true;
  private _runnable: () => void;

  /**
   * Creates a new Timer with the given runnable.
   *
   * @param runnable The function to run on each tick.
   */
  constructor(runnable: () => void) {
    this._runnable = runnable;
  }

  private _tick(timeStamp: number): void {
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
      this._runnable();
    }

    if (this._repeats || this._tickCount < 1) {
      window.requestAnimationFrame(this._tick.bind(this));
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
  set delay(delayMs: number) {
    this._delay = validatePositive(delayMs, 'delay');
  }

  /**
   * Gets the function that is run on each tick.
   */
  get runnable(): () => void {
    return this._runnable;
  }

  /**
   * Sets the function that is run on each tick.
   *
   * @throws If the timer is currently running.
   */
  set runnable(runnable: () => void) {
    if (this.isRunning) {
      throw new Error('Cannot set runnable while timer is running');
    }

    this._runnable = runnable;
  }

  /**
   * Delays the next tick by the given number of milliseconds.
   *
   * @param delayMs The number of milliseconds to delay the next tick.
   * Defaults to {@link Timer.DEFAULT_DELAY_MS}.
   */
  delayNextTick(delayMs: number = this.delay): void {
    this._lastTick = Timer._now() + delayMs;
  }

  /**
   * Stops the timer.
   */
  stop(): void {
    this._running = false;
  }

  /**
   * Starts the timer.
   * If the timer is already running, this method does nothing.
   *
   * @param delayMs (default: last delay used or {@link Timer.DEFAULT_DELAY_MS}) The number of milliseconds between ticks.
   * @param initialDelayMs (default: last delay used or {@link Timer.DEFAULT_DELAY_MS}) The number of milliseconds to wait before the first tick.
   * @param repeats (default: true) Whether the timer should repeat after the first tick.
   * @throws If initialDelayMs is negative or delayMs is not positive.
   */
  start(
    delayMs: number = this._delay,
    initialDelayMs: number = this._delay,
    repeats: boolean = true
  ): void {
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
