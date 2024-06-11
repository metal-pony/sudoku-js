import Timer from '../util/Timer';
import Scene from './Scene';

export default class Engine {
  static get MIN_FPS() { return 10; }
  static get MAX_FPS() { return 120; }
  static get DEFAULT_FPS() { return 60; }

  // Maybe load this from a config file or something
  static DEBUG = true;
  static debug(msg) {
    if (Engine.DEBUG) {
      console.log(msg);
    }
  }

  constructor(/*{ width, height }: { width: number, height: number }*/) {
    // this.width = width;
    // this.height = height;

    /** @type {HTMLCanvasElement} */
    this._canvas = null;
    /** @type {CanvasRenderingContext2D} */
    this._context = null;
    /** @type {Timer} */
    this._timer = null;
    /** @type {{[key: string]: Scene}}*/
    this._scenes = {};
    this._activeScene = '';
    this._fps = Engine.DEFAULT_FPS;
  }

  /**
   *
   * @param {HTMLCanvasElement} canvas
   * @throws {Error} If canvas context cannot be retrieved.
   */
  connect(canvas) {
    this._canvas = canvas;
    this._context = canvas.getContext('2d');

    if (!this._context) {
      throw new Error('Could not get canvas context!');
    }

    this._timer = new Timer((elapsed) => {
      try {
        this.gameloop(elapsed);
      } catch (error) {
        Engine.debug(error);
        this.stop();
      }
    });

    this._timer.delay = 1000 / this._fps;
  }

  get canvas() {
    if (!this._canvas) {
      throw new Error('Canvas is not set!');
    }

    return this._canvas;
  }

  get timer() {
    if (!this._timer) {
      throw new Error('Timer is not set!');
    }

    return this._timer;
  }

  // TODO get actual fps performance

  get fps() {
    return this._fps;
  }

  set fps(fps) {
    if (fps < Engine.MIN_FPS || fps > Engine.MAX_FPS) {
      throw new Error(`FPS must be between ${Engine.MIN_FPS} and ${Engine.MAX_FPS}!`);
    }

    this._fps = fps;

    if (this._timer) {
      this._timer.delay = 1000 / fps;
    }
  }

  get scenes() {
    return this._scenes;
  }

  /**
   * Get the active scene, or null if not scene is active.
   * @returns {Scene | null}
   */
  get activeScene() {
    if (!this._activeScene) {
      return null;
    }

    return this._scenes[this._activeScene];
  }

  /**
   * Switch to scene 'main'.
   */
  goToMainScene() {
    this.switchToScene('main');
  }

  /**
   *
   * @param {string} name
   * @throws {Error} If the scene does not exist.
   */
  switchToScene(name) {
    const newScene = this._scenes[name];
    if (!newScene) {
      throw new Error(`Scene '${name}' does not exist!`);
    }

    const currentScene = this.activeScene;
    if (currentScene) {
      currentScene.dispose();
    }

    this._activeScene = name;
    newScene.init(this);
  }

  /**
   *
   * @param {string} name
   * @param {Scene} scene
   * @throws {Error} If the scene already exists.
   */
  addScene(name, scene) {
    if (this._scenes[name]) {
      throw new Error(`Scene '${name}' already exists!`);
    }

    this._scenes[name] = scene;
  }

  /**
   * Starts the engine and gameloop timer at the main scene.
   */
  start() {
    Engine.debug('Starting engine');
    this.goToMainScene();
    this.timer.start();
  }

  get isRunning() {
    return this.timer.isRunning;
  }

  /**
   * Stops the gameloop timer, effectively stopping the scene updates and rendering.
   */
  stop() {
    Engine.debug('Stopping engine');
    this.timer.stop();
  }

  /**
   * Performs scene updates and rerenders the canvas.
   * @param {number} elapsed The elapsed time since the last update.
   */
  gameloop(elapsed) {
    // Engine.debug('gameloop()');
    // process input

    // update game state then render
    if (this.activeScene) {
      this.activeScene.update(this, elapsed);

      // this.activeScene.render(this._canvas!, elapsed);
      this.activeScene.render(this._canvas, elapsed);
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
