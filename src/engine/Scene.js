import Engine from './Engine.js';
import GameObj from './GameObj.js';
import Point from './Point.js';

/*
Responsible for:
  - managing game objects (add/remove)
  - update logic
  - rendering
    - background
    - game objects
    - overlays
*/

/**
 * @typedef {Object} SceneDimensions
 * @property {number} width The width of the scene.
 * @property {number} height The height of the scene.
 * @property {number} viewWidth The visible width of the view.
 * @property {number} viewHeight The visible height of the view.
 */

/**
 * @typedef {object} GridProps
 * @property {number} sizePx
 * @property {string} colorCode
 * @property {Point} origin
 */

/**
 * @typedef {object} SceneProps
 * @property {string} name
 * @property {SceneDimensions} dims
 * @property {boolean?} showGrid
 * @property {boolean?} showFPS?
 * @property {GridProps?} gridProps?
 * @property {GameObj[]?} objs?
 * @property {string?} bgColorCode?
 */

export default class Scene {
  // TODO Add background layers

  /**
   * @param {SceneProps} props
   */
  constructor(props) {
    /**
     * Dimensions of the scene.
     * @type {SceneDimensions}
     */
    this._dims = {...props.dims};

    // TODO unused
    this.viewLocation = new Point({ x: 0, y: 0 });

    /**
     * GameObjects the scene will render.
     * @type {GameObj[]}
     */
    this._objs = props.objs ? [...props.objs] : [];

    /**
     * Properties related to rendering a grid overlay.
     * @type {GridProps}
     */
    this._gridProps = {
      sizePx: 32,
      colorCode: 'grey',
      origin: { x: 0, y: 0 }
    };
    if (props.gridProps) {
      Object.assign(this._gridProps, props.gridProps);
    }

    /** Name of the scene. (Required).*/
    this._name = props.name;
    if (!this._name) {
      throw new Error('Scene name is required');
    }
    /** Canvas background color.*/
    this._bgColor = props.bgColorCode;
    /** Keeps track of the last timestamp that FPS was rendered.*/
    this._lastFpsRender = 0;
    /** Whether to show the FPS at the top corner of the canvas.*/
    this._showFPS = Boolean(props.showFPS);
    /** Whether to show a grid across the canvas.*/
    this._showGrid = Boolean(props.showGrid);
    /** Distance between grid lines, in pixels.*/
    this._gridSize = Number(props.gridSize);
  }

  /** Name of the scene.*/
  get name() { return this._name; }
  /** Game objects managed by the scene.*/
  get objs() { return this._objs; }
  /** Scene width. May be larger than the scene's rendering space.*/
  get width() { return this._dims.width; }
  /** Scene height. May be larger than the scene's rendering space.*/
  get height() { return this._dims.height; }

  /** Background color.*/
  get background() { return this._background; }
  /**
   * Sets the scene's background color.
   * @param {string} colorCode
   */
  set background(colorCode) {
    this._background = colorCode;
  }

  /** Whether the FPS overlay is being rendered.*/
  get showFPS() { return this._showFPS; }
  /**
   * Sets whether to render the FPS in an overlay.
   * @param {boolean} showingFPS
   */
  set showFPS(showingFPS) {
    this._showFPS = Boolean(showingFPS);
  }

  /** Whether the grid overlay is being rendered.*/
  get showGrid() { return this._showGrid; }
  /**
   * Sets whether to render a grid in an overlay.
   * @param {boolean} showingGrid
   */
  set showGrid(showingGrid) {
    console.log(`showGrid = ${Boolean(showingGrid)}`);
    this._showGrid = Boolean(showingGrid);
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
   * Initialization code that runs when the scene initially loads or is reset.
   */
  load() {}

  /**
   * Performs updates on game objects given an elapsed time since last gameloop.
   * @param {number} elapsed
   */
  update(elapsed) {
    this._objs.forEach((obj, i) => {
      obj.update(elapsed);

      // If the object is outside the bounds of the scene, bounce it back in
      if (obj.left < 0 && obj.velocity.x < 0) {
        obj.velocity.x = -obj.velocity.x * 0.66;
      } else if (obj.right > this.width && obj.velocity.x > 0) {
        obj.velocity.x = -obj.velocity.x * 0.66;
      }

      if (obj.top < 0 && obj.velocity.y < 0) {
        // Do nothing
      } else if (obj.bottom > this.height && obj.velocity.y > 0) {
        obj.shift(0, this.height - obj.bottom);

        // if obj is not moving faster than some threshold, then stop it
        if (Math.abs(obj.velocity.y) < 2) {
          obj.velocity.y = 0;
          // The contact with the ground should cause friction if it is moving in the x direction and slide,
          // so slow it down more than if it were bouncing off the ground.
          obj.velocity.x *= 0.25;
          obj.angularVelocity = 0;
        } else {
          obj.velocity.y = -obj.velocity.y * 0.66;
          // TODO Calculate based on the object's mass and geometry and current velocities
          // whether it should have a change in angular velocity.
          obj.velocity.x *= 0.66;
          obj.angularVelocity *= 0.75;
        }
      }
    });
  }

  /**
   * Renders the scene background.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} elapsed
   */
  renderBackground(ctx, elapsed) {
    ctx.fillStyle = this._bgColor;
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.renderBackgroundHook) {
      this.renderBackgroundHook(ctx, elapsed);
    }
  }

  /**
   * Renders the scene and its objects in the following order:
   *
   * - clears canvas
   * - renderBackground
   * - renderBackgroundHook (user hook), if set
   * - game objects (up to 3ms)
   * - renderGrid, if set
   * - renderFPS, if set
   * - renderHook (user hook)
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} elapsed Time since last gameloop.
   */
  render(ctx, elapsed) {
    ctx.clearRect(0, 0, this.width, this.height);
    this.renderBackground(ctx, elapsed);

    // console.log('(Scene) Rendering objects');
    const start = performance.now();
    for (const obj of this._objs) {
      if (performance.now() - start > 3) {
        break;
      }
      obj.render(ctx);
    }

    if (this.showGrid) {
      this.renderGrid(ctx);
    }

    if (this.showFPS) {
      this.renderFps(ctx);
    }

    if (this.renderHook) {
      this.renderHook(ctx, elapsed);
    }
  }

  /**
   * Renders a grid over the canvas.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   */
  renderGrid(ctx) {
    ctx.strokeStyle = this._gridProps.colorCode;
    ctx.lineWidth = 1;
    // TODO Work with gridProps.origin
    ctx.beginPath();
    for (let x = 0; x <= this.width; x += this._gridProps.sizePx) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    for (let y = 0; y <= this.height; y += this._gridProps.sizePx) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * Renders the FPS over the canvas. Automatically calculated from the last
   * time this was called.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   */
  renderFps(ctx) {
    const now = performance.now();
    const elapsed = now - this._lastFpsRender;
    this._lastFpsRender = now;
    ctx.fillStyle = 'black';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Elapsed: ${elapsed | 0}ms`, 10, 20)
    ctx.textAlign = 'right';
    ctx.fillText(`FPS: ${Math.trunc(1000 / elapsed)}`, canvas.width - 10, 20);
  }

  dispose() {
    Engine.debug('Scene dispose');
    while (this._objs.length > 0) {
      const obj = this._objs.pop();
      obj.dispose();
    }
  }
}
