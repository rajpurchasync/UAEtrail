/** Show the saved catalog with no network call while it is younger than this. */
export const CATALOG_FRESH_MS = 60_000;
/** While a screen stays open, recheck at this pace. A publish still refreshes immediately. */
export const CATALOG_FULL_REFRESH_MS = 180_000;

export type CatalogSnapshot<T> = {
  etag: string | null;
  savedAt: number;
  fullAt: number;
  data: T;
};

type SnapshotFile = { v: 1; entries: Record<string, CatalogSnapshot<unknown>> };

type SnapshotStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const STORAGE_KEY = 'uaetrail.catalog-cache.v1';
const MAX_CHARS = 1_500_000;

export const catalogQueryKeyId = (queryKey: readonly unknown[]): string => JSON.stringify(queryKey);

const keyStartsWith = (key: unknown[], prefix: readonly unknown[]): boolean =>
  prefix.every((part, index) => JSON.stringify(key[index]) === JSON.stringify(part));

export const catalogSnapshotIsFresh = (
  snapshot: { savedAt: number } | null,
  now = Date.now(),
  freshMs = CATALOG_FRESH_MS
): boolean => Boolean(snapshot && now - snapshot.savedAt < freshMs);

export const etagForConditionalGet = (
  snapshot: { etag: string | null; fullAt: number } | null,
  now = Date.now(),
  maxAge = CATALOG_FULL_REFRESH_MS
): string | null => {
  if (!snapshot?.etag) return null;
  if (now - snapshot.fullAt >= maxAge) return null;
  return snapshot.etag;
};

export const createCatalogSnapshotStore = (storage: SnapshotStorage) => {
  const readFile = (): SnapshotFile => {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return { v: 1, entries: {} };
      const parsed = JSON.parse(raw) as SnapshotFile;
      if (parsed?.v !== 1 || !parsed.entries || typeof parsed.entries !== 'object') {
        return { v: 1, entries: {} };
      }
      return parsed;
    } catch {
      return { v: 1, entries: {} };
    }
  };

  const writeFile = (file: SnapshotFile): void => {
    try {
      const raw = JSON.stringify(file);
      if (raw.length > MAX_CHARS) return;
      storage.setItem(STORAGE_KEY, raw);
    } catch {
      try {
        storage.removeItem(STORAGE_KEY);
      } catch {
        /* storage unavailable */
      }
    }
  };

  return {
    read<T>(queryKey: readonly unknown[]): CatalogSnapshot<T> | null {
      const entry = readFile().entries[catalogQueryKeyId(queryKey)];
      if (!entry || !('data' in entry)) return null;
      return entry as CatalogSnapshot<T>;
    },
    write<T>(queryKey: readonly unknown[], data: T, etag: string | null, full: boolean): void {
      const file = readFile();
      const id = catalogQueryKeyId(queryKey);
      const previous = file.entries[id] as CatalogSnapshot<T> | undefined;
      const now = Date.now();
      file.entries[id] = {
        etag,
        savedAt: now,
        fullAt: full ? now : (previous?.fullAt ?? now),
        data,
      };
      writeFile(file);
    },
    clearPrefix(prefix: readonly unknown[]): void {
      const file = readFile();
      for (const id of Object.keys(file.entries)) {
        try {
          const key = JSON.parse(id) as unknown[];
          if (Array.isArray(key) && keyStartsWith(key, prefix)) delete file.entries[id];
        } catch {
          delete file.entries[id];
        }
      }
      writeFile(file);
    },
  };
};

const memoryBag = new Map<string, string>();
const memoryStorage: SnapshotStorage = {
  getItem: (key) => memoryBag.get(key) ?? null,
  setItem: (key, value) => {
    memoryBag.set(key, value);
  },
  removeItem: (key) => {
    memoryBag.delete(key);
  },
};

const browserStorage = (): SnapshotStorage =>
  typeof localStorage === 'undefined' ? memoryStorage : localStorage;

export const catalogSnapshots = createCatalogSnapshotStore(browserStorage());

export const catalogFreshQueryOptions = <T>(queryKey: readonly unknown[]) => {
  const snapshot = catalogSnapshots.read<T>(queryKey);
  return {
    ...(snapshot ? { initialData: snapshot.data, initialDataUpdatedAt: snapshot.savedAt } : {}),
    staleTime: CATALOG_FRESH_MS,
    refetchOnWindowFocus: true as const,
    refetchInterval: CATALOG_FULL_REFRESH_MS,
    refetchIntervalInBackground: false as const,
  };
};

type ConditionalLoad<T> =
  | { notModified: true; etag: string | null }
  | { notModified: false; etag: string | null; data: T };

export const loadCachedCatalog = async <T>(
  queryKey: readonly unknown[],
  load: (etag: string | null) => Promise<ConditionalLoad<T>>
): Promise<T> => {
  const snapshot = catalogSnapshots.read<T>(queryKey);
  if (snapshot && catalogSnapshotIsFresh(snapshot)) return snapshot.data;
  const result = await load(etagForConditionalGet(snapshot));
  if (result.notModified) {
    if (snapshot) {
      catalogSnapshots.write(queryKey, snapshot.data, result.etag ?? snapshot.etag, false);
      return snapshot.data;
    }
    const fresh = await load(null);
    if (fresh.notModified) throw new Error('Catalog refresh returned no data');
    catalogSnapshots.write(queryKey, fresh.data, fresh.etag, true);
    return fresh.data;
  }
  catalogSnapshots.write(queryKey, result.data, result.etag, true);
  return result.data;
};
