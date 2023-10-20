import Timer from "../util/Timer";
import Scene from "./Scene";

type SceneMap = { [key: string]: Scene };

export default class Engine {
  static readonly MIN_FPS = 10;
  static readonly MAX_FPS = 120;
  static readonly DEFAULT_FPS = 60;
  // Maybe load this from a config file or something
  static DEBUG = true;
  static debug = (msg?: any) => {
    if (Engine.DEBUG) {
      console.log(msg);
    }
  }

  private _canvas: HTMLCanvasElement | null;
  private _context: CanvasRenderingContext2D | null;
  private _timer: Timer | null;

  private _fps: number = 0;

  private _scenes: SceneMap;
  private _activeScene: string;

  constructor(/*{ width, height }: { width: number, height: number }*/) {
    // this.width = width;
    // this.height = height;

    this._canvas = null;
    this._context = null;
    this._timer = null;
    this._scenes = {};
    this._activeScene = '';
    this._fps = Engine.DEFAULT_FPS;
  }

  connect(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._context = canvas.getContext('2d');

    if (!this._context) {
      throw new Error('Could not get canvas context!');
    }

    this._timer = new Timer((elapsed: number) => {
      try {
        this.gameloop(elapsed);
      } catch (error) {
        Engine.debug(error);
        this.stop();
      }
    });

    this._timer.delay = 1000 / this._fps;
  }

  get canvas(): HTMLCanvasElement {
    if (!this._canvas) {
      throw new Error('Canvas is not set!');
    }

    return this._canvas;
  }

  private get timer(): Timer {
    if (!this._timer) {
      throw new Error('Timer is not set!');
    }

    return this._timer;
  }

  // TODO get actual fps performance

  get fps(): number {
    return this._fps;
  }

  set fps(fps: number) {
    if (fps < Engine.MIN_FPS || fps > Engine.MAX_FPS) {
      throw new Error(`FPS must be between ${Engine.MIN_FPS} and ${Engine.MAX_FPS}!`);
    }

    this._fps = fps;

    if (this._timer) {
      this._timer.delay = 1000 / fps;
    }
  }

  get scenes(): SceneMap {
    return this._scenes;
  }

  get activeScene(): Scene | null {
    if (!this._activeScene) {
      return null;
    }

    return this._scenes[this._activeScene];
  }

  goToMainScene() {
    this.switchToScene('main');
  }

  switchToScene(name: string) {
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

  addScene(name: string, scene: Scene): void {
    if (this._scenes[name]) {
      throw new Error(`Scene '${name}' already exists!`);
    }

    this._scenes[name] = scene;
  }

  start(): void {
    Engine.debug('Starting engine');
    this.goToMainScene();
    this.timer.start();
  }

  get isRunning(): boolean {
    return this.timer.isRunning;
  }

  stop(): void {
    Engine.debug('Stopping engine');
    this.timer.stop();
  }

  gameloop(elapsed: number) {
    // Engine.debug('gameloop()');
    // process input

    // update game state then render
    if (this.activeScene) {
      this.activeScene.update(this, elapsed);

      this.activeScene.render(this._canvas!);
    } else {
      Engine.debug('No active scene');
    }
  }

  shutdown() {
    this.stop();
    // Call dispose on all scenes
    Object.values(this._scenes).forEach(scene => scene.dispose());
  }
}
