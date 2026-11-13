import { GEO_NODE_ID_ALIASES, type GeoNodeLite, type GeoTreeDTO } from '@uaetrail/shared-types';
import { geoHierarchyApi } from '../api/domains/geoHierarchy';

const IDB_NAME = 'uaetrail-geo';
const IDB_STORE = 'tree';

/** In-memory geo tree (plan §18.6) plus IndexedDB + ETag revalidate. */
export class GeoStore {
  byId = new Map<string, GeoNodeLite>();
  byPath = new Map<string, string>();
  children = new Map<string, string[]>();
  names: { k: string; id: string }[] = [];
  version = 0;
  etag: string | null = null;

  load(tree: GeoTreeDTO) {
    this.version = tree.version;
    this.byId.clear();
    this.byPath.clear();
    this.children.clear();
    this.names = [];
    for (const n of tree.nodes) {
      this.byId.set(n.id, n);
      this.byPath.set(n.path, n.id);
      if (n.p) {
        const kids = this.children.get(n.p) ?? [];
        kids.push(n.id);
        this.children.set(n.p, kids);
      }
      this.names.push({ k: n.n.toLowerCase(), id: n.id });
      if (n.a) this.names.push({ k: n.a.toLowerCase(), id: n.id });
    }
    for (const [from, to] of Object.entries(GEO_NODE_ID_ALIASES ?? {})) {
      const node = this.byId.get(to);
      if (!node) continue;
      this.byId.set(from, node);
      this.byPath.set(from, node.id);
      const kids = this.children.get(to);
      if (kids) this.children.set(from, kids);
    }
    this.names.sort((x, y) => (x.k < y.k ? -1 : x.k > y.k ? 1 : 0));
  }

  search(prefix: string, limit = 8): GeoNodeLite[] {
    const q = prefix.trim().toLowerCase();
    if (!q) return [];
    let lo = 0;
    let hi = this.names.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.names[mid]!.k < q) lo = mid + 1;
      else hi = mid;
    }
    const out: GeoNodeLite[] = [];
    const seen = new Set<string>();
    for (let i = lo; i < this.names.length && out.length < limit; i += 1) {
      const row = this.names[i]!;
      if (!row.k.startsWith(q) && !row.k.includes(q)) break;
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      const node = this.byId.get(row.id);
      if (node) out.push(node);
    }
    return out;
  }

  childrenOf(id: string): GeoNodeLite[] {
    return (this.children.get(id) ?? []).map((cid) => this.byId.get(cid)).filter((n): n is GeoNodeLite => Boolean(n));
  }

  countryByCode(code: string): GeoNodeLite | null {
    const needle = code.trim().toLowerCase();
    if (!needle) return null;
    for (const node of this.byId.values()) {
      if (node.kind !== 'country') continue;
      if (node.iso?.toLowerCase() === needle) return node;
      if (node.s.toLowerCase() === needle) return node;
      const tail = node.path.split('/').filter(Boolean).pop();
      if (tail?.toLowerCase() === needle) return node;
    }
    return null;
  }
}

export const geoStore = new GeoStore();

const openDb = (): Promise<IDBDatabase> | null => {
  if (typeof indexedDB === 'undefined') return null;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const readCachedTree = async (): Promise<{ etag: string; tree: GeoTreeDTO } | null> => {
  const dbp = openDb();
  if (!dbp) return null;
  try {
    const db = await dbp;
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get('current');
      req.onsuccess = () => resolve((req.result as { etag: string; tree: GeoTreeDTO } | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

const writeCachedTree = async (etag: string, tree: GeoTreeDTO): Promise<void> => {
  const dbp = openDb();
  if (!dbp) return;
  try {
    const db = await dbp;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put({ etag, tree }, 'current');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* ignore */
  }
};

export const hydrateGeoStore = async (): Promise<GeoTreeDTO | null> => {
  const cached = await readCachedTree();
  if (cached) {
    geoStore.load(cached.tree);
    geoStore.etag = cached.etag;
  }
  try {
    const res = await geoHierarchyApi.getGeoTreeConditional(cached?.etag ?? geoStore.etag);
    if (res.notModified) {
      if (res.etag) geoStore.etag = res.etag;
      return cached?.tree ?? null;
    }
    const tree = res.body.data;
    const etag = res.etag ?? `"v${tree.version}"`;
    geoStore.load(tree);
    geoStore.etag = etag;
    await writeCachedTree(etag, tree);
    return tree;
  } catch {
    return cached?.tree ?? null;
  }
};
