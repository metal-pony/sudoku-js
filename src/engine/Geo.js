import LinearLineSeg from './LinearLineSeg.js';
import Point from './Point.js';

export const EPSILON = 1e-10;

/**
 * Calculates the distance between the given points.
 * @param {Point} p1
 * @param {Point} p2
 * @returns {number}
 */
export const dist = (p1, p2) => Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);

/**
 * Calculates the angle (radians) between the given points relative to the x axis.
 * @param {Point} p1
 * @param {Point} p2
 * @returns {number} The angle between the given points in radians.
 */
export const angle = (p1, p2) => Math.atan2(p2.y - p1.y, p2.x - p1.x);

/**
 * Calculates the angle (degrees) between the given points relative
 * to the x axis.
 * @param {Point} p1
 * @param {Point} p2
 * @returns {number} The angle between the given points.
 */
export const angleDeg = (p1, p2) => (angle(p1, p2) * 180 / Math.PI);

/**
 * Determines if the given line segments are parallel within the given epsilon.
 * @param {LinearLineSeg} l1
 * @param {LinearLineSeg} l2
 * @param {number} epsilon
 * @returns {boolean}
 */
export const parallel = (l1, l2, epsilon = EPSILON) => (Math.abs(l1.m - l2.m) < epsilon);

/**
 * Determines if the given line segment contains the given point within the given epsilon.
 * @param {LinearLineSeg} l
 * @param {Point} p
 * @param {number} epsilon
 * @returns {boolean}
 */
export const containsPoint = (l, p, epsilon = EPSILON) => {
  const xMin = Math.min(l.p1.x, l.p2.x);
  const xMax = Math.max(l.p1.x, l.p2.x);
  const yMin = Math.min(l.p1.y, l.p2.y);
  const yMax = Math.max(l.p1.y, l.p2.y);
  const isWithinXBounds = xMin - epsilon <= p.x && p.x <= xMax + epsilon;
  const isWithinYBounds = yMin - epsilon <= p.y && p.y <= yMax + epsilon;
  const expectedPy = l.m * p.x + l.b;

  return (
    isWithinXBounds &&
    isWithinYBounds &&
    (l.hasSlope() ? Math.abs(expectedPy - p.y) <= epsilon : true)
  );
};

/**
 * Determines if the given line segments intersect within the given epsilon.
 * @param {LinearLineSeg} l1
 * @param {LinearLineSeg} l2
 * @param {number} epsilon
 * @returns {boolean}
 */
export const intersects = (l1, l2, epsilon = EPSILON) => {
  // They are the same line.
  if (l1.equals(l2)) {
    return true;
  }

  // Check if any of the endpoints are on the other line.
  // Handles the all cases where the lines are parallel.
  if (
    containsPoint(l1, l2.p1, epsilon) ||
    containsPoint(l1, l2.p2, epsilon) ||
    containsPoint(l2, l1.p1, epsilon) ||
    containsPoint(l2, l1.p2, epsilon)
  ) {
    return true;
  }

  // If parallel and above didn't return, then they don't intersect.
  if (parallel(l1, l2, epsilon)) {
    return false;
  }

  // Find the intersection point.
  let x, y;
  if (l1.hasSlope() && l2.hasSlope()) {
    x = (l2.b - l1.b) / (l1.m - l2.m);
    y = l1.m * x + l1.b;
  } else if (l1.hasSlope()) {
    x = l2.p1.x;
    y = l1.m * x + l1.b;
  } else {
    x = l1.p1.x;
    y = l2.m * x + l2.b;
  }

  // Check if the intersection point is on both lines.
  return (
    containsPoint(l1, new Point({ x, y }), epsilon) &&
    containsPoint(l2, new Point({ x, y }), epsilon)
  );
};
