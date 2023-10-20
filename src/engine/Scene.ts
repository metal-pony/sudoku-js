import Engine from "./Engine";
import GameObj from "./GameObj";
import Point from "./Point";

export type SceneDimensions = {
  width: number,
  height: number,
  viewWidth: number,
  viewHeight: number
};

export default class Scene {
  private dims: SceneDimensions;
  private viewLocation: Point;
  private _objs: GameObj[];
  private _background: string;

  // layers

  constructor(dims: SceneDimensions) {
    this.dims = dims;
    this.viewLocation = new Point({ x: 0, y: 0 });
    this._objs = [];
    this._background = 'white';
  }

  get objs(): GameObj[] {
    return this._objs;
  }

  set background(color: string) {
    this._background = color;
  }

  addObj(obj: GameObj) {
    this._objs.push(obj);
  }

  removeObj(obj: GameObj) {
    this._objs = this._objs.filter(o => o !== obj);
  }

  init(engine: Engine) {
    engine.canvas.width = this.dims.viewWidth;
    engine.canvas.height = this.dims.viewHeight;
    const ctx =  engine.canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context!');
    }

    ctx.clearRect(0, 0, engine.canvas.width, engine.canvas.height);
  }

  update(engine: Engine, elapsed: number) {
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

  render(canvas: HTMLCanvasElement) {
    // Engine.debug('Scene render');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context!');
    }

    ctx.clearRect(0, 0,canvas.width,canvas.height);
    ctx.fillStyle = this._background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(-this.viewLocation.x, -this.viewLocation.y);
    this._objs.forEach(obj => obj.render(ctx));
  }

  dispose() {
    Engine.debug('Scene dispose');
    this._objs.forEach(obj => obj.dispose());
  }
}
