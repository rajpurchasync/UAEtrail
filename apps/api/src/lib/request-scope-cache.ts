import { AsyncLocalStorage } from 'node:async_hooks';

type RequestScopeStore = Map<string, Promise<unknown>>;

const requestScope = new AsyncLocalStorage<RequestScopeStore>();

/** Run downstream HTTP handlers with a per-request promise memo map. */
export const runWithRequestScope = (fn: () => void): void => {
  requestScope.run(new Map(), fn);
};

export const getOrSetRequestScoped = async <T>(key: string, factory: () => Promise<T>): Promise<T> => {
  const store = requestScope.getStore();
  if (!store) return factory();

  const existing = store.get(key);
  if (existing) return existing as Promise<T>;

  const pending = factory();
  store.set(key, pending);
  return pending;
};
