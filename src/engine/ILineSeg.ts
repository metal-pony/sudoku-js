import Point from "./Point";

export default interface ILineSeg {
  /**
   * The type of line segment.
   * Used for indexing into the IntersectionMap at runtime.
   */
  get type(): string;

  /**
   * The first point of the line segment.
   */
  get p1(): Point;

  /**
   * The second point of the line segment.
   */
  get p2(): Point;

  /**
   * Sets the first point of the line segment.
   */
  set p1(p1: Point);

  /**
   * Sets the second point of the line segment.
   */
  set p2(p2: Point);

  /**
   * The length of the line segment.
   */
  get length(): number;

  /**
   * The angle between p1 and p2 (radians).
   */
  get angle(): number;

  /**
   * The angle between p1 and p2 (degrees).
   */
  get angleDeg(): number;

  /**
   * Calculates the y value at a given x value.
   *
   * @param x The x value to calculate the y value for.
   */
  calcY(x: number): number;

  /**
   * Calculates the x value at a given y value.
   *
   * @param y The y value to calculate the x value for.
   */
  calcX(y: number): number;

  /**
   * Returns true if the line segment is parallel to another line segment.
   *
   * @param other The other line segment.
   */
  isParallel(other: ILineSeg): boolean;

  /**
   * Returns true if the line segment contains a point.
   *
   * @param p The point to check.
   */
  containsPoint(p: Point): boolean;

  /**
   * Returns true if the line segment intersects another line segment.
   *
   * @param other The other line segment.
   */
  intersects(other: ILineSeg): boolean;
}
