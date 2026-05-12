export class ObjectPool<T> {
  private pool: T[] = [];
  private create: () => T;
  private reset: (item: T) => void;

  constructor(create: () => T, reset: (item: T) => void, initialSize = 0) {
    this.create = create;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(create());
    }
  }

  acquire(): T {
    return this.pool.length > 0 ? this.pool.pop()! : this.create();
  }

  release(item: T): void {
    this.reset(item);
    this.pool.push(item);
  }

  get available(): number {
    return this.pool.length;
  }
}
