import Timer from '../util/Timer.js';
import Scene from './Scene.js';

/*
Responsible for:
  - manipulating the canvas element
    - setting dimensions according to the current scene requirements
    - NOT update game objects or rendering, but passing the rendering context to scenes
  - top-level game controls
    - start
    - stop
    - pause
    - resume
    - reset
    - shutdown
    - scene change
*/

const fpsRange = [20, 120];
const defaultFPS = 60;
const GL_STATUS = {
  /** Indicates that the gameloop won't be used for the game.*/
  DISCONNECTED: 'DISCONNECTED',
  /** Indicates that the gameloop timer has stopped.*/
  STOPPED: 'STOPPED',
  /** Indicates that the game is executing update logic.*/
  UPDATING: 'UPDATING',
  /** Indicates that the game is executing rendering logic.*/
  RENDERING: 'RENDERING',
  /** Indicates that the game is idle between timer ticks.*/
  WAITING: 'WAITING'
};
const STATUS = {
  /** Indicates that the game has stopped.*/
  STOPPED: 'STOPPED',
  /** Indicates that the current scene running.*/
  IN_PROGRESS: 'IN_PROGRESS',
  /** Indicates that the game is paused.*/
  PAUSED : 'PAUSED',
  /** Indicates that the game is loading a scene.*/
  LOADING: 'LOADING'
};

export default class Engine {
  static get MIN_FPS() { return fpsRange[0]; }
  static get MAX_FPS() { return fpsRange[1]; }
  static get DEFAULT_FPS() { return defaultFPS; }
  static get STATUS() { return {...STATUS}; }

  // Maybe load this from a config file or something
  static DEBUG = true;
  static debug(msg) {
    if (Engine.DEBUG) {
      console.log(msg);
    }
  }

  /**
   * Creates a new Game Engine instance.
   */
  constructor() {
    /** @type {HTMLCanvasElement} */
    this._canvas = null;
    /** @type {Timer} */
    this._timer = null;
    /** @type {{[key: string]: Scene}}*/
    this._scenes = {};
    this._activeScene = '';
    this._fps = Engine.DEFAULT_FPS;
    this._status = STATUS.STOPPED;
    this._gameloopStatus = GL_STATUS.DISCONNECTED;
  }

  /**
   * Connects the engine to a canvas element. This must be called before starting the engine.
   * Subsequent render calls will draw to the canvas.
   * @param {HTMLCanvasElement} canvas
   */
  connect(canvas) {
    this._canvas = canvas;
  }

  /**
   * The target FPS.
   *
   * TODO currently FPS is not used
   */
  get targetFPS() {
    return this._fps;
  }

  /**
   * Sets the game's target FPS.
   */
  set targetFPS(fps) {
    if (fps < Engine.MIN_FPS || fps > Engine.MAX_FPS) {
      throw new Error(`FPS must be between ${Engine.MIN_FPS} and ${Engine.MAX_FPS}!`);
    }

    this._fps = fps;

    if (this._timer) {
      this._timer.delay = 1000 / fps;
    }
  }

  /**
   * Gets all the game scenes.
   */
  get scenes() { return this._scenes; }

  /**
   * Get the active scene, or null if not scene is active.
   * @returns {Scene | null}
   */
  get activeScene() {
    return this._activeScene;
  }

  /** Gets whether the gameloop timer is running.*/
  // get isRunning() { return Boolean(this._timer?.isRunning); }
  /** Gets the status of the game.*/
  get status() { return this._status; }
  /** Gets the status of the gameloop.*/
  get gameloopStatus() { return this._gameloopStatus; }

  /**
   * Switches scenes.
   * Disposes the current scene, if there is one.
   * If the given scene is already active, does nothing.
   * @param {string} name
   * @throws {Error} If the canvas has not yet been set, or the scene does not exist.
   */
  switchToScene(name) {
    if (!this._canvas) throw new Error('must connect a canvas first');
    if (!this._scenes[name]) throw new Error(`Scene '${name}' does not exist!`);

    // If the gameloop is active, then it needs to be stopped.
    //   After it has stopped, dispose of the current scene and load the new one,
    //   then restart the gameloop.
    // else (not using gameloop)
    //   dispose of the current scene and load the new one
    //   do not start with gameloop

    console.log(`(Engine) switching to scene '${name}'`);

    if (this._activeScene) {
      // Scene is already active
      if (this._activeScene.name === name) return;
      // Otherwise, run scene cleanup
      this._activeScene.dispose();
    }
    this._activeScene = this._scenes[name];
    this._activeScene.load(this);
    this._canvas.width = this._activeScene.width;
    this._canvas.height = this._activeScene.height;
    this.render();
  }

  /**
   * Renders the scene, resizing the canvas if necessary.
   */
  renderWithResize() {
    this._canvas.width = this._activeScene.width;
    this._canvas.height = this._activeScene.height;
    this.render();
  }

  /**
   * Adds a scene with a name.
   * @param {Scene} scene
   * @throws {Error} If the scene already exists.
   */
  addScene(scene) {
    if (this._scenes[scene.name]) {
      throw new Error(`Scene '${scene.name}' already exists!`);
    }
    this._scenes[scene.name] = scene;
  }

  /**
   * Starts the current scene, optionally with the gameloop timer for scene updates and rendering.
   * @param {boolean} withTimer Whether the timer should be used.
   * @throws {Error} If the canvas is not set, scene is not set, or the gameloop timer is not being used.
   */
  start(withTimer) {
    if (!this._canvas) throw new Error('Canvas not set');
    if (!this._activeScene) throw new Error('No active scene');
    if (this.status === STATUS.IN_PROGRESS) return;

    if (Boolean(withTimer)) {
      if (this._timer) {
        this._timer.delay = 1000 / this._fps;

      } else {
        this._timer = new Timer((elapsed) => {
          try {
            this.gameloop(elapsed);
          } catch (error) {
            Engine.debug(error);
            this.stop();
          }
        });
      }
      this._gameloopStatus = GL_STATUS.STOPPED;
      this._timer.start();
    } else {
      if (this._timer && this._timer.isRunning) {
        this._timer.stop();
      }
      this._timer = null;
      this._gameloopStatus = GL_STATUS.DISCONNECTED;
    }
    this._status = STATUS.IN_PROGRESS;
  }

  /**
   * Stops the gameloop and sets the game status to STOPPED.
   */
  stop() {
    Engine.debug('Stopping engine');
    if (this._timer) {
      this._timer.stop();
      this._gameloopStatus = GL_STATUS.STOPPED;
    }
    this._status = STATUS.STOPPED;
  }

  /**
   * Resets the current scene.
   * The game is stopped, scene disposed, reloaded and rendered.
   */
  resetScene() {
    this.stop();
    this._activeScene.dispose();
    this._activeScene.load(this);
    this._canvas.width = this._activeScene.width;
    this._canvas.height = this._activeScene.height;
    this.render();
  }

  /**
   * Renders the current scene. Call this if rendering manually wihtout gameloop.
   * @param {number} elapsed Amount of time since last render.
   */
  render(elapsed = 0) {
    if (!this._canvas) throw new Error('No canvas set');
    if (!this.activeScene) throw new Error('No active scene');
    this.activeScene.render(this._canvas.getContext('2d'), elapsed);
  }

  /**
   * Performs scene updates and rerenders the canvas.
   * @param {number} elapsed The elapsed time since the last update.
   */
  gameloop(elapsed) {
    if (this._gameStatus === STATUS.STOPPED) {
      return;
    }

    // TODO process input

    // update game state, then render
    if (this.activeScene) {
      this.activeScene.update(elapsed);
      this.activeScene.render(this._canvas.getContext('2d'), elapsed);
    } else {
      Engine.debug('No active scene');
    }
  }

  /**
   * Stops the engine and disposes of all scenes.
   */
  shutdown() {
    this.stop();
    // Call dispose on all scenes
    Object.values(this._scenes).forEach(scene => scene.dispose());
  }
}
