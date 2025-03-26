import GameObj from './GameObj.js';
import Scene from './Scene.js';

/**
 * @typedef {Object} GridSceneDimensions
 * @property {number} cellSize
 * @property {number} width The width of the scene (in cells).
 * @property {number} height The height of the scene (in cells).
 */

/**
 * @typedef {object} GridSceneGridProps
 * @property {number} sizeCells In a GridScene, the optional grid overlay
 * if drawn at a size multiple of the scene's cellSize.
 *
 * i.e. `gridProps.sizeCells = 3` draws the grid lines every 3 cells.
 * @property {string} colorCode
 * @property {Point} origin
 */

/**
 * @typedef {object} GridSceneProps
 * @property {string} name
 * @property {GridSceneDimensions} dims
 * @property {boolean?} showGrid
 * @property {boolean?} showFPS
 * @property {GridSceneGridProps?} gridProps
 * @property {GameObj[]?} objs
 * @property {string} bgColorCode
 */

/**
 * @typedef {object} Cell
 * @property {number} x
 * @property {number} y
 * @property {object} data
 */

export default class GridScene extends Scene {
  /**
   * @param {GridSceneProps} props
   */
  constructor(props) {
    super(props);

    /** @type {GridSceneDimensions} */
    this._dims = {...props.dims};

    /** @type {GridSceneGridProps} */
    this._gridProps = {
      sizeCells: 1, // grid lines between each cell
      colorCode: 'grey',
      origin: { x: 0, y: 0 }
    };
    if (props.gridProps) {
      Object.assign(this._gridProps, props.gridProps);
    }

    /** @type {Cell[][]} */
    this._cells = [];
    for (let row = 0; row < this.rows; row++) {
      this._cells.push([]);
      for (let col = 0; col < this.cols; col++) {
        this._cells[row].push(this._newCell(row, col));
      }
    }

    /**
     * Whether to redraw all cells.
     * @type {boolean}
     */
    this._redrawOnlyOnCellChange = false;

    /**
     * Cells that need to be redrawn.
     * @type {number[]}
     */
    this._cellsToRedraw = [];
  }

  /**
   * Creates a new cell given row, col, with default data.
   * @param {number} row
   * @param {number} col
   * @returns {Cell}
   */
  _newCell(row, col) {
    return ({
      x: col,
      y: row,
      data: {
        color: '#00000000'
      }
    });
  }

  // TODO Get obj data with live object copy

  /** All cell data.*/
  get cells() { return this._cells; }
  /** Cell size, in pixels.*/
  get cellSize() { return this._dims.cellSize; }
  set cellSize(size) {
    this._dims.cellSize = Math.max(1, size);
    this._width = this.cols * size;
    this._height = this.rows * size;
  }
  get width() { return this.cols * this._dims.cellSize; }
  get height() { return this.rows * this._dims.cellSize; }
  get rows() { return this._dims.height; }
  get cols() { return this._dims.width; }

  /**
   * @param {number} columns
   */
  set cols(columns) {
    columns = (columns | 0);
    if (columns === this.cols) return;
    if (columns <= 0) throw new Error('columns must be positive');
    // TODO not hardcoded
    if (columns > (1<<20)) throw new Error(`columns too large (${columns}); max ${(1<<20)}`);
    const diff = Math.abs(this.cols - columns);
    if (columns > this.cols) {
      for (let row = 0; row < this.rows; row++) {
        const cellRow = this._cells[row];
        for (let d = 0; d < diff; d++) {
          cellRow.push(this._newCell(row, cellRow.length));
        }
      }
    } else {
      for (let row = 0; row < this.rows; row++) {
        const cellRow = this._cells[row];
        for (let d = 0; d < diff; d++) {
          cellRow.pop();
        }
      }
    }
    this._dims.width = columns;
  }

  /**
   * @param {number} rows
   */
  set rows(rows) {
    rows = (rows | 0);
    if (rows === this.rows) return;
    if (rows <= 0) throw new Error('rows must be positive');
    // TODO not hardcoded
    if (rows > (1<<20)) throw new Error(`rows too large (${rows}); max ${(1<<20)}`);
    const diff = Math.abs(this.rows - rows);
    if (rows > this.rows) {
      for (let d = 0; d < diff; d++) {
        const cellRow = [];
        for (let col = 0; col < this.cols; col++) {
          cellRow.push(this._newCell(this.rows + d, col));
        }
        this._cells.push(cellRow);
      }
    } else {
      for (let d = 0; d < diff; d++) {
        this._cells.pop();
      }
    }
    this._dims.height = rows;
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @returns {object} Cell data object.
   */
  cellData(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
      return null;
    }
    return this._cells[y][x].data;
  }

  /**
   *
   * @param {number} elapsed
   */
  update(elapsed) {
    const start = performance.now();
    for (let i = 0; i < this._objs.length; i++) {
      if (performance.now() - start > 3) {
        break;
      }
      const obj = this._objs[i];
      obj.update(elapsed);
    }
    if (this.updateHook) {
      this.updateHook(elapsed);
    }
  }

  renderBackground(ctx, elapsed) {
    console.log('(Scene) Rendering background');
    ctx.fillStyle = this._bgColor;
    ctx.fillRect(0, 0, this.width, this.height);

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this._cells[row][col];
        const x = cell.x * this.cellSize;
        const y = cell.y * this.cellSize;
        ctx.fillStyle = cell.data.color;
        ctx.fillRect(x, y, this.cellSize, this.cellSize);
      }
    }
    if (this._cellsToRedraw.length > 0) {
      this._cellsToRedraw = [];
    }

    if (this.renderBackgroundHook) {
      this.renderBackgroundHook(this.canvas, elapsed);
    }
  }

  renderGrid(ctx) {
    console.log('(Scene) Drawing grid');
    ctx.strokeStyle = this._gridProps.colorCode;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const offset = this._gridProps.sizeCells * this.cellSize;
    for (let x = 0; x <= this.width; x += offset) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    for (let y = 0; y <= this.height; y += offset) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
}
