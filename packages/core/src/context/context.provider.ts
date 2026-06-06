import { AsyncLocalStorage } from 'node:async_hooks';

export class ContextProvider<T> {
  private static instance: ContextProvider<unknown>;

  static getInstance<T>(): ContextProvider<T> {
    if (!ContextProvider.instance) {
      ContextProvider.instance = new ContextProvider<T>();
    }

    return ContextProvider.instance as ContextProvider<T>;
  }

  private readonly storage = new AsyncLocalStorage<T>();

  enterWith(context: T): void {
    this.storage.enterWith(context);
  }

  get(): T {
    return this.storage.getStore() as T;
  }

  set<Value>(key: string, value: Value): void {
    const store = this.get();
    store[key] = value;
  }

  delete(key: string): void {
    const store = this.get();
    delete store[key];
  }
}
