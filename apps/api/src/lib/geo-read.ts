import type { Collection, Document } from 'mongodb';
import type { GeoCountsDTO, GeoSummaryDTO } from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import {
  findGeoNode,
  loadGeoTree,
  publicGeoNode,
  subtreeIdsForNode,
  type GeoTreeIndex,
} from './geo-tree.js';
import { LocationStatus } from '../domain/enums.js';
import { ActivityStatus } from '../domain/enums.js';

type GeoStatsRow = Document & { _id: string; rev?: number };

const statsCol = (): Collection<GeoStatsRow> =>
  getMongoClient()!.db().collection<GeoStatsRow>(COLLECTIONS.GEO_STATS);

const db = () => getMongoClient()!.db();

const livePlaceStatus = { $in: [LocationStatus.ACTIVE, 'active', 'ACTIVE'] };
const liveActivityStatus = { $in: [ActivityStatus.PUBLISHED, 'published', 'PUBLISHED'] };

const chainInSubtree = (subtreeIds: string[]): Document =>
  subtreeIds.length === 1 ? { 'geoRef.chain': subtreeIds[0] } : { 'geoRef.chain': { $in: subtreeIds } };

const livePlaceMatch = (subtreeIds: string[]): Document => ({
  ...chainInSubtree(subtreeIds),
  status: livePlaceStatus,
});

const liveActivityMatch = (subtreeIds: string[], now = new Date()): Document => ({
  ...chainInSubtree(subtreeIds),
  status: liveActivityStatus,
  $or: [{ endAt: { $gt: now } }, { endAt: null, startAt: { $gte: now } }],
});

const countBySubtree = async (
  collection: string,
  match: Document
): Promise<number> => db().collection(collection).countDocuments(match);

const countsDto = (act: number, pl: number, fac: number): GeoCountsDTO => ({
  act: { total: act },
  pl: { total: pl },
  fac: { total: fac },
});

const liveCountsForSubtree = async (subtreeIds: string[], now: Date): Promise<GeoCountsDTO> => {
  const [act, pl, fac] = await Promise.all([
    countBySubtree(COLLECTIONS.ACTIVITIES, liveActivityMatch(subtreeIds, now)),
    countBySubtree(COLLECTIONS.LOCATIONS, livePlaceMatch(subtreeIds)),
    countBySubtree(COLLECTIONS.FACILITIES, livePlaceMatch(subtreeIds)),
  ]);
  return countsDto(act, pl, fac);
};

export const loadGeoCountsByIds = async (
  ids: string[],
  index?: GeoTreeIndex
): Promise<Record<string, GeoCountsDTO>> => {
  const sliced = ids.slice(0, 50);
  if (sliced.length === 0) return {};
  const tree = index ?? (await loadGeoTree());
  const now = new Date();
  const entries = await Promise.all(
    sliced.map(async (id) => {
      const dto = await liveCountsForSubtree(subtreeIdsForNode(tree, id), now);
      return [id, dto] as const;
    })
  );
  return Object.fromEntries(entries);
};

export const composeGeoSummary = async (
  idOrPath: string,
  index?: GeoTreeIndex
): Promise<GeoSummaryDTO | null> => {
  const tree = index ?? (await loadGeoTree());
  const node = findGeoNode(tree, idOrPath);
  if (!node) return null;
  const nodeId = String(node._id);
  const kids = tree.children.get(nodeId) ?? [];
  const ids = [nodeId, ...kids.map((k) => String(k._id))];
  const counts = await loadGeoCountsByIds(ids, tree);
  const crumbs: GeoSummaryDTO['breadcrumbs'] = [];
  for (const aid of node.ancestors) {
    const a = tree.byId.get(aid);
    if (a) crumbs.push(publicGeoNode(a));
  }
  crumbs.push(publicGeoNode(node));
  const docs = await statsCol()
    .find({ _id: { $in: ids } })
    .project({ rev: 1 })
    .toArray();
  const self = counts[nodeId] ?? countsDto(0, 0, 0);
  const rev = Math.max(
    0,
    ...docs.map((d) => Number(d.rev ?? 0)),
    self.act?.total ?? 0,
    self.pl?.total ?? 0
  );
  return {
    node: publicGeoNode(node),
    breadcrumbs: crumbs,
    counts: self,
    children: kids.map((c) => ({
      ...publicGeoNode(c),
      counts: counts[String(c._id)] ?? countsDto(0, 0, 0),
    })),
    rev,
  };
};

const geoListPageSize = (limit?: number) => Math.min(20, Math.max(1, limit ?? 20));

const resolveListSubtree = async (nodeId: string): Promise<string[]> => {
  const tree = await loadGeoTree();
  return subtreeIdsForNode(tree, nodeId);
};

export const listGeoFacilities = async (nodeId: string, type?: string, cursor?: string, limit?: number) => {
  const subtreeIds = await resolveListSubtree(nodeId);
  const filter: Document = livePlaceMatch(subtreeIds);
  if (type) filter.facilityKind = type;
  if (cursor) filter._id = { $gt: cursor };
  const rows = await db()
    .collection(COLLECTIONS.FACILITIES)
    .find(filter)
    .sort({ _id: 1 })
    .limit(geoListPageSize(limit) + 1)
    .project({ name: 1, facilityKind: 1, latitude: 1, longitude: 1, geoRef: 1, areaId: 1 })
    .toArray();
  const page = geoListPageSize(limit);
  const next = rows.length > page ? String(rows[page]._id) : null;
  return { items: rows.slice(0, page), nextCursor: next };
};

export const listGeoActivities = async (nodeId: string, type?: string, cursor?: string, limit?: number) => {
  const subtreeIds = await resolveListSubtree(nodeId);
  const filter: Document = liveActivityMatch(subtreeIds);
  if (type) filter.activityType = type.toUpperCase();
  if (cursor) filter._id = { $gt: cursor };
  const rows = await db()
    .collection(COLLECTIONS.ACTIVITIES)
    .find(filter)
    .sort({ startAt: 1, _id: 1 })
    .limit(geoListPageSize(limit) + 1)
    .project({
      title: 1,
      activityType: 1,
      startAt: 1,
      geoRef: 1,
      areaId: 1,
      images: { $slice: 2 },
      bannerUrl: 1,
      meetingLat: 1,
      meetingLng: 1,
      startLat: 1,
      startLng: 1,
    })
    .toArray();
  const page = geoListPageSize(limit);
  const next = rows.length > page ? String(rows[page]._id) : null;
  return { items: rows.slice(0, page), nextCursor: next };
};

export const listGeoPlaces = async (nodeId: string, kind?: string, cursor?: string, limit?: number) => {
  const subtreeIds = await resolveListSubtree(nodeId);
  const filter: Document = livePlaceMatch(subtreeIds);
  if (kind === 'trail') filter.activityType = { $in: ['hiking', 'HIKING'] };
  if (kind === 'camp_spot') filter.activityType = { $in: ['camping', 'CAMPING'] };
  if (cursor) filter._id = { $gt: cursor };
  const rows = await db()
    .collection(COLLECTIONS.LOCATIONS)
    .find(filter)
    .sort({ _id: 1 })
    .limit(geoListPageSize(limit) + 1)
    .project({ name: 1, activityType: 1, latitude: 1, longitude: 1, geoRef: 1, areaId: 1, slug: 1, images: { $slice: 2 } })
    .toArray();
  const page = geoListPageSize(limit);
  const next = rows.length > page ? String(rows[page]._id) : null;
  return { items: rows.slice(0, page), nextCursor: next };
};
