import { describe, expect, it } from 'vitest';
import {
  CATALOG_FRESH_MS,
  CATALOG_FULL_REFRESH_MS,
  catalogSnapshotIsFresh,
  createCatalogSnapshotStore,
  etagForConditionalGet,
} from './catalogSnapshot';

const memoryStorage = () => {
  const bag = new Map<string, string>();
  return {
    getItem: (key: string) => bag.get(key) ?? null,
    setItem: (key: string, value: string) => {
      bag.set(key, value);
    },
    removeItem: (key: string) => {
      bag.delete(key);
    },
  };
};

describe('catalog snapshot', () => {
  it('keeps the last body and only sends a validator while it is still inside the full-refresh window', () => {
    const store = createCatalogSnapshotStore(memoryStorage());
    const key = ['explore', 'map'] as const;
    store.write(key, [{ id: 'a' }], 'W/"1"', true);
    const snapshot = store.read<Array<{ id: string }>>(key);
    expect(snapshot?.data).toEqual([{ id: 'a' }]);
    expect(etagForConditionalGet(snapshot, snapshot!.fullAt + 1_000)).toBe('W/"1"');
    expect(etagForConditionalGet(snapshot, snapshot!.fullAt + CATALOG_FULL_REFRESH_MS)).toBeNull();
    expect(catalogSnapshotIsFresh(snapshot, snapshot!.savedAt + 1_000)).toBe(true);
    expect(catalogSnapshotIsFresh(snapshot, snapshot!.savedAt + CATALOG_FRESH_MS)).toBe(false);
  });

  it('drops every map entry when the catalog is reloaded', () => {
    const store = createCatalogSnapshotStore(memoryStorage());
    store.write(['explore', 'map'], [1], 'W/"1"', true);
    store.write(['explore', 'map', 'user-1'], [2], 'W/"2"', true);
    store.write(['me', 'activities'], [3], 'W/"3"', true);
    store.clearPrefix(['explore', 'map']);
    expect(store.read(['explore', 'map'])).toBeNull();
    expect(store.read(['explore', 'map', 'user-1'])).toBeNull();
    expect(store.read(['me', 'activities'])?.data).toEqual([3]);
  });
});
