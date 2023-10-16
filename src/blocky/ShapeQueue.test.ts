import ShapeQueue from "./ShapeQueue";

describe("ShapeQueue", () => {
  let queue: ShapeQueue;

  beforeEach(() => {
    queue = new ShapeQueue();
  });

  it('is empty when created', () => {
    expect(queue.size).toBe(0);
    expect(queue.isEmpty()).toBe(true);
  });

  it('adds elements to the queue automatically when peeked or polled', () => {
    expect(queue.size).toBe(0);
    expect(queue.isEmpty()).toBe(true);
    queue.peek();
    expect(queue.size).toBeGreaterThan(0);
    expect(queue.isEmpty()).toBe(false);

    queue = new ShapeQueue();
    expect(queue.size).toBe(0);
    expect(queue.isEmpty()).toBe(true);
    queue.poll();
    expect(queue.size).toBeGreaterThan(0);
    expect(queue.isEmpty()).toBe(false);
  });

  describe('static copy', () => {
    const _shapes = [1, 2, 3, 4, 5, 6, 7];

    beforeEach(() => {
      for (const n of _shapes) {
        queue['_shapes'].push(n);
      }
    });

    it('copies the queue', () => {
      expect(ShapeQueue.copy(queue)).toEqual(queue);
      expect(ShapeQueue.copy(queue)).not.toBe(queue);
    });

    it('does not modify the original queue', () => {
      ShapeQueue.copy(queue);
      expect(queue['_shapes']).toEqual(_shapes);
    });
  });

  describe("constructor", () => {
    it("creates an empty queue", () => {
      expect(queue.size).toBe(0);
      expect(queue.isEmpty()).toBe(true);
    });

    it("creates a queue with the given minSize", () => {
      const queue = new ShapeQueue(10);
      // The queue is empty until we call peek or poll
      expect(queue.size).toBe(0);
      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe("isEmpty", () => {
    it("returns true when the queue is empty", () => {
      expect(queue.isEmpty()).toBe(true);
    });

    it("returns false when the queue is not empty", () => {
      queue.peek();
      expect(queue.isEmpty()).toBe(false);
    });
  });

  describe("poll", () => {
    it("returns the first shape in the queue", () => {
      const shape = queue.peek();
      expect(queue.poll()).toBe(shape);
    });
  });

  describe("peek", () => {
    it("returns the first shape in the queue", () => {
      const shape = queue.peek();
      expect(queue.peek()).toBe(shape);
    });
  });

  describe("peekNext", () => {
    it("returns the first n shapes in the queue", () => {
      const n = 10;
      const shapes = queue.peekNext(n);

      expect(shapes.length).toBe(n);
      for (let i = 0; i < n; i++) {
        expect(shapes[i]).toBe(queue.poll());
      }
    });
  });

  describe("clear", () => {
    it("clears the queue", () => {
      queue.peek();
      expect(queue.size).toBeGreaterThan(0);
      expect(queue.isEmpty()).toBe(false);

      queue.clear();
      expect(queue.size).toBe(0);
      expect(queue.isEmpty()).toBe(true);
    });
  });
});
