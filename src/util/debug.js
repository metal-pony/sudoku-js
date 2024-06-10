export default class Debugger {
  constructor(enabled = true) {
    this._enabled = Boolean(enabled)
  }

  log(...things) {
    if (this._enabled) {
      console.log(...things);
    }
  }
}
