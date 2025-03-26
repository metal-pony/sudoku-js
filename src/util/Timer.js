import { validateNonNegative, validatePositive } from './common.js';

export default class Timer {
  static get DEFAULT_DELAY_MS() { return 1000; }

  /**
   * Creates a new Timer with the given runnable.
   * @param {(elapsed: number) => void} runnable The function to run on each tick.
   */
  constructor(runnable) {
    this._runnable = runnable;
    this._tickCount = 0;
    this._lastTick = 0;
    this._stopSignal = false;
    this._running = false;
    this._delay = Timer.DEFAULT_DELAY_MS;
    this._repeats = true;
    this._tickCallback = this._tick.bind(this);
    this._stopCallback = null;
  }

  /**
   * @param {number} timeStamp
   */
  _tick(timeStamp) {
    if (this._stopSignal) {
      this._running = false;
      if (this._stopCallback) {
        this._stopCallback();
      }
      this._stopCallback = null;
      return;
    }

    this._running = true;
    // This is for the first tick once started, since _lastTick will be 0
    if (this._lastTick <= 0) {
      this._lastTick = timeStamp;
    }

    const timeSinceLastTick = (timeStamp - this._lastTick);

    // if (timeSinceLastTick >= this._delay) {
      // this._lastTick += this._delay;
      this._lastTick = timeStamp;
      this._tickCount++;
      this._runnable(timeSinceLastTick);
    // }

    if (this._repeats || (this._tickCount < 1)) {
      requestAnimationFrame(this._tickCallback);
      return;
    }

    this._stopSignal = true;
    this._running = false;
    if (this._stopCallback) {
      this._stopCallback();
    }
    this._stopCallback = null;
  }

  /** Whether the timer is currently running.*/
  get isRunning() { return this._running; }
  /** Whether the stop signal has been sent.*/
  get isStopped() { return this._stopSignal; }
  /** Time (ms) between ticks.*/
  get delay() { return this._delay; }
  /** Set the time (ms) between ticks.*/
  set delay(delayMs) { this._delay = validatePositive(delayMs, 'delay'); }
  /** Gets the function that is run on each tick.*/
  get runnable() { return this._runnable; }

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
    this._lastTick = (performance.now() + delayMs);
  }

  /**
   * Stops the timer gracefully so that it may finish its current process.
   * @param {()=>void} callback Called after the timer has stopped, or right away
   * if it has already stopped.
   */
  stop(callback = null) {
    this._stopSignal = true;
    if (!this._running) {
      if (callback) {
        callback();
      }
    } else {
      this._stopCallback = callback;
    }
  }

  /**
   * Starts the timer.
   * If the timer is already running, this method does nothing.
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
    if (this.isRunning) return;

    this.delay = delayMs; // validates input
    this._repeats = repeats;
    this._tickCount = 0;
    this._lastTick = 0;
    this._stopSignal = false;
    const nextTick = (
      performance.now() +
      ((initialDelayMs >= 0) ? initialDelayMs : delayMs)
    );
    this._tick(nextTick);
  }
}
