import type { Collection } from 'mongodb';
import {
  GEO_COUNTRY_AE_ID,
  canonicalGeoNodeId,
  pointInAreaBounds,
  type GeoKind,
  type GeoLevel,
  type GeoNodeDoc,
  type GeoNodeLite,
  type GeoTreeDTO,
} from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { logger } from './logger.js';

export type GeoTreeIndex = {
  version: number;
  byId: Map<string, GeoNodeDoc>;
  byPath: Map<string, GeoNodeDoc>;
  children: Map<string, GeoNodeDoc[]>;
  areas: GeoNodeDoc[];
  states: GeoNodeDoc[];
  venues: GeoNodeDoc[];
};

let tree: GeoTreeIndex | null = null;
let loadedAt = 0;
const RELOAD_MS = 30_000;

const geoNodes = (): Collection<GeoNodeDoc> =>
  getMongoClient()!.db().collection<GeoNodeDoc>(COLLECTIONS.GEO_NODES);

const geoMeta = (): Collection<{ _id: string; treeVersion?: number }> =>
  getMongoClient()!.db().collection(COLLECTIONS.GEO_META);

const emptyTree = (version: number): GeoTreeIndex => ({
  version,
  byId: new Map(),
  byPath: new Map(),
  children: new Map(),
  areas: [],
  states: [],
  venues: [],
});

const indexNodes = (nodes: GeoNodeDoc[], version: number): GeoTreeIndex => {
  const next = emptyTree(version);
  for (const node of nodes) {
    if (node.status !== 'active') continue;
    next.byId.set(String(node._id), node);
    next.byPath.set(node.path, node);
    if (node.kind === 'area') next.areas.push(node);
    if (node.kind === 'state') next.states.push(node);
    if (node.kind === 'venue') next.venues.push(node);
    if (node.parentId) {
      const kids = next.children.get(node.parentId) ?? [];
      kids.push(node);
      next.children.set(node.parentId, kids);
    }
  }
  for (const kids of next.children.values()) {
    kids.sort((a, b) => a.sort - b.sort || a.names.en.localeCompare(b.names.en));
  }
  return next;
};

export const loadGeoTree = async (force = false): Promise<GeoTreeIndex> => {
  const now = Date.now();
  if (!force && tree && now - loadedAt < RELOAD_MS) return tree;
  try {
    const [nodes, meta] = await Promise.all([
      geoNodes().find({}).toArray(),
      geoMeta().findOne({ _id: 'tree' }),
    ]);
    tree = indexNodes(nodes, meta?.treeVersion ?? 1);
    loadedAt = now;
    return tree;
  } catch (err) {
    logger.warn({ err }, 'geo tree load failed');
    if (tree) return tree;
    tree = emptyTree(0);
    return tree;
  }
};

export const invalidateGeoTree = (): void => {
  tree = null;
  loadedAt = 0;
};

export const bumpGeoTreeVersion = async (): Promise<number> => {
  const now = new Date();
  const result = await geoMeta().findOneAndUpdate(
    { _id: 'tree' },
    { $inc: { treeVersion: 1 }, $set: { updatedAt: now } },
    { upsert: true, returnDocument: 'after' }
  );
  invalidateGeoTree();
  return result?.treeVersion ?? 1;
};

const toLite = (n: GeoNodeDoc): GeoNodeLite => ({
  id: String(n._id),
  p: n.parentId ?? null,
  l: n.level as GeoLevel,
  s: n.slug,
  n: n.names.en,
  a: n.names.ar,
  c: n.center.coordinates,
  path: n.path,
  kind: n.kind as GeoKind,
  ...(n.isoCode ? { iso: n.isoCode } : {}),
});

export const geoTreeDto = (index: GeoTreeIndex): GeoTreeDTO => ({
  version: index.version,
  nodes: [...index.byId.values()].map(toLite),
});

export const publicGeoNode = toLite;

export const findGeoNode = (index: GeoTreeIndex, idOrPath: string): GeoNodeDoc | null => {
  const canonical = canonicalGeoNodeId(idOrPath);
  return (
    index.byId.get(canonical) ??
    index.byPath.get(canonical) ??
    index.byId.get(idOrPath) ??
    index.byPath.get(idOrPath) ??
    null
  );
};

/** This node plus every descendant (country → states → areas → venues). */
export const collectSubtreeIds = (index: GeoTreeIndex, rootId: string): string[] => {
  const ids = [rootId];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const kid of index.children.get(id) ?? []) {
      const kidId = String(kid._id);
      ids.push(kidId);
      stack.push(kidId);
    }
  }
  return ids;
};

export const subtreeIdsForNode = (index: GeoTreeIndex, nodeId: string): string[] => {
  const resolved = findGeoNode(index, nodeId);
  const id = resolved ? String(resolved._id) : nodeId;
  return index.byId.has(id) ? collectSubtreeIds(index, id) : [id];
};

export const otherAreaIdForState = (stateId: string): string => `geo-area-other-${stateId}`;

const ringFromBbox = (
  bbox: [number, number, number, number]
): Array<{ latitude: number; longitude: number }> => {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return [
    { latitude: minLat, longitude: minLng },
    { latitude: minLat, longitude: maxLng },
    { latitude: maxLat, longitude: maxLng },
    { latitude: maxLat, longitude: minLng },
  ];
};

const nodeContainsPoint = (node: GeoNodeDoc, lat: number, lng: number): boolean => {
  const poly = node.geometry?.coordinates;
  if (node.geometry?.type === 'Polygon' && Array.isArray(poly) && Array.isArray(poly[0])) {
    const ring = (poly[0] as number[][]).map(([x, y]) => ({
      longitude: x,
      latitude: y,
    }));
    return pointInAreaBounds(lat, lng, ring);
  }
  if (node.bbox) return pointInAreaBounds(lat, lng, ringFromBbox(node.bbox));
  if (node.radiusM && node.center) {
    const [lng0, lat0] = node.center.coordinates;
    const dLat = (lat - lat0) * 111_320;
    const dLng = (lng - lng0) * 111_320 * Math.cos((lat * Math.PI) / 180);
    return Math.hypot(dLat, dLng) <= node.radiusM;
  }
  return false;
};

export const findAreaNodeAtPoint = (
  index: GeoTreeIndex,
  lat: number,
  lng: number
): GeoNodeDoc | null => {
  const hits = index.areas.filter((n) => nodeContainsPoint(n, lat, lng));
  hits.sort((a, b) => a.sort - b.sort);
  return hits[0] ?? null;
};

export const findStateNodeAtPoint = (
  index: GeoTreeIndex,
  lat: number,
  lng: number
): GeoNodeDoc | null => {
  const hits = index.states.filter((n) => nodeContainsPoint(n, lat, lng));
  hits.sort((a, b) => a.sort - b.sort);
  return hits[0] ?? null;
};

const venueNameKey = (value: string): string =>
  value.toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ');

export const findVenueNodeAtPoint = (
  index: GeoTreeIndex,
  lat: number,
  lng: number,
  areaId?: string | null
): GeoNodeDoc | null => {
  const pool = areaId
    ? (index.children.get(areaId) ?? []).filter((n) => n.kind === 'venue')
    : index.venues;
  const hits = pool.filter((n) => nodeContainsPoint(n, lat, lng));
  hits.sort(
    (a, b) => (a.radiusM ?? 1_000_000) - (b.radiusM ?? 1_000_000) || a.sort - b.sort
  );
  return hits[0] ?? null;
};

export const findVenueNodeByName = (
  index: GeoTreeIndex,
  areaId: string,
  name: string | null | undefined
): GeoNodeDoc | null => {
  const raw = name?.trim();
  if (!raw) return null;
  const key = venueNameKey(raw);
  const kids = (index.children.get(areaId) ?? []).filter((n) => n.kind === 'venue');
  return (
    kids.find((n) => {
      const names = [n.names.en, n.slug, ...(n.aliases ?? [])];
      return names.some((candidate) => {
        const ck = venueNameKey(candidate);
        return ck === key || key.includes(ck) || ck.includes(key);
      });
    }) ?? null
  );
};

export const countryNode = (index: GeoTreeIndex): GeoNodeDoc | null =>
  index.byId.get(GEO_COUNTRY_AE_ID) ?? [...index.byId.values()].find((n) => n.kind === 'country') ?? null;
