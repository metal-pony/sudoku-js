import Engine from './Engine.js';
import GameObj from './GameObj.js';
import Point from './Point.js';

/**
 * @typedef {Object} SceneDimensions
 * @property {number} width The width of the scene.
 * @property {number} height The height of the scene.
 * @property {number} viewWidth The visible width of the view.
 * @property {number} viewHeight The visible height of the view.
 */

export default class Scene {
  // TODO Add layers

  /**
   * @param {SceneDimensions} dims
   */
  constructor(dims) {
    this.dims = dims;
    this.viewLocation = new Point({ x: 0, y: 0 });
    /** @type {GameObj[]} */
    this._objs = [];
    this._background = 'white';
  }

  get objs() {
    return this._objs;
  }

  /**
   * Sets the background color of the scene.
   * @param {string} color The color to set the background to (e.g. 'white' or '#dc8c22').
   */
  set background(color) {
    this._background = color;
  }

  /**
   * Add the given object to the scene.
   * @param {GameObj} obj
   */
  addObj(obj) {
    this._objs.push(obj);
  }

  /**
   * Remove the given object from the scene
   * @param {GameObj} obj
   */
  removeObj(obj) {
    this._objs = this._objs.filter(o => o !== obj);
  }

  /**
   *
   * @param {Engine} engine
   */
  init(engine) {
    engine.canvas.width = this.dims.viewWidth;
    engine.canvas.height = this.dims.viewHeight;
    const ctx =  engine.canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context!');
    }

    ctx.clearRect(0, 0, engine.canvas.width, engine.canvas.height);
  }

  /**
   *
   * @param {Engine} engine
   * @param {number} elapsed
   */
  update(engine, elapsed) {
    this._objs.forEach(obj => {
      obj.update(engine, elapsed);

      // If the object is outside the bounds of the scene, bounce it back in
      if (obj.left < 0) {
        obj.location = { x: 0, y: obj.location.y };
        obj.velocity.x = -obj.velocity.x;
      } else if (obj.right > this.dims.width) {
        obj.location.x = this.dims.width - obj.width;
        obj.velocity.x = -obj.velocity.x;
      }

      if (obj.top < 0) {
        obj.location.y = 0;
        obj.velocity.y = -obj.velocity.y;
      } else if (obj.bottom > this.dims.height) {
        obj.location.y = this.dims.height - obj.height;
        obj.velocity.y = -obj.velocity.y;
      }
    });
  }

  /**
   *
   * @param {HTMLCanvasElement} canvas
   * @param {number} elapsed
   */
  render(canvas, elapsed) {
    // Engine.debug('Scene render');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context!');
    }

    // ctx.clearRect(0, 0,canvas.width,canvas.height);
    ctx.fillStyle = this._background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(-this.viewLocation.x, -this.viewLocation.y);
    this._objs.forEach(obj => obj.render(ctx));

    // Draw the elapsed time in the top left corner
    ctx.fillStyle = 'black';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Elapsed: ${elapsed}`, 10, 20);

    // Draw the FPS in the top right corner
    ctx.textAlign = 'right';
    ctx.fillText(`FPS: ${Math.round(1000 / elapsed)}`, canvas.width - 10, 20);

  }

  dispose() {
    Engine.debug('Scene dispose');
    this._objs.forEach(obj => obj.dispose());
  }
}
