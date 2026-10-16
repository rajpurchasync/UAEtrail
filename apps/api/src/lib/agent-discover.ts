import type { Collection } from 'mongodb';
import type { AgentDiscoverItemDTO, AgentDiscoverResponseDTO } from '@uaetrail/shared-types';
import {
  isFacilityPlaceKind,
  placeDetailPath,
  placeKindFromLocationRow,
} from '@uaetrail/shared-types';
import { activityPublicMetaDescription } from '@uaetrail/shared-types';
import type { Location } from '../domain/types.js';
import { shouldHideActivityFromExploreMap } from '../domain/activity-join-mode.js';
import { ActivityStatus, LocationStatus } from '../domain/enums.js';
import { formatActivityLocal } from './datetime.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { getMongoClient } from './mongo.js';
import { normalizeSearchRegexInput } from './regex-search.js';

type MongoLocationDoc = Omit<Location, 'id'> & { _id: string };

const activitiesCollection = (): Collection<MongoActivityDoc> =>
  getMongoClient()!.db().collection<MongoActivityDoc>('activities');

const locationsCollection = (): Collection<MongoLocationDoc> =>
  getMongoClient()!.db().collection<MongoLocationDoc>('locations');

export type AgentDiscoverSearchInput = {
  siteOrigin: string;
  q: string;
  kinds: Array<'activity' | 'place'>;
  region?: string;
  limit: number;
};

const absUrl = (origin: string, path: string) => `${origin.replace(/\/$/, '')}${path}`;

const placePath = (place: { id: string; activityType: string }): string =>
  placeDetailPath(String(place.activityType), place.id);

const placeKindWire = (activityType: string): AgentDiscoverItemDTO['placeKind'] => {
  const kind = activityType.toLowerCase();
  if (kind === 'camping') return 'camp';
  if (kind === 'shop') return 'shop';
  if (kind === 'event' || kind === 'community_activity') return 'venue';
  return 'trail';
};

const buildRegionClause = (region: string | undefined, field: string): Record<string, unknown> | null => {
  const needle = normalizeSearchRegexInput(region);
  if (!needle) return null;
  return { [field]: { $regex: needle, $options: 'i' } };
};

const loadLocationsByIds = async (ids: string[]): Promise<Map<string, MongoLocationDoc>> => {
  if (ids.length === 0) return new Map();
  const unique = [...new Set(ids)];
  const docs = await locationsCollection().find({ _id: { $in: unique } }).toArray();
  return new Map(docs.map((doc) => [doc._id, doc]));
};

const matchingLocationIdsForText = async (needle: string, region?: string): Promise<string[]> => {
  const filter: Record<string, unknown> = {
    status: LocationStatus.ACTIVE,
    registryListed: { $ne: false },
    $or: [
      { name: { $regex: needle, $options: 'i' } },
      { region: { $regex: needle, $options: 'i' } },
      { description: { $regex: needle, $options: 'i' } },
    ],
  };
  const regionClause = buildRegionClause(region, 'region');
  if (regionClause) Object.assign(filter, regionClause);

  const docs = await locationsCollection().find(filter).project({ _id: 1 }).limit(80).toArray();
  return docs.map((doc) => doc._id);
};

export const searchPublishedActivitiesForAgents = async (
  input: Pick<AgentDiscoverSearchInput, 'q' | 'region' | 'limit' | 'siteOrigin'>
): Promise<AgentDiscoverItemDTO[]> => {
  const needle = normalizeSearchRegexInput(input.q);
  if (!needle) return [];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const locationIds = await matchingLocationIdsForText(needle, undefined);
  const textOr: Record<string, unknown>[] = [
    { title: { $regex: needle, $options: 'i' } },
    { description: { $regex: needle, $options: 'i' } },
  ];
  if (locationIds.length > 0) {
    textOr.push({ locationId: { $in: locationIds } });
  }

  const filter: Record<string, unknown> = {
    status: ActivityStatus.PUBLISHED,
    startAt: { $gte: startOfToday },
    joinMode: { $ne: 'private' },
    $or: textOr,
  };

  if (input.region?.trim()) {
    const regionNeedle = normalizeSearchRegexInput(input.region);
    if (!regionNeedle) return [];
    const regionLocationIds = await matchingLocationIdsForText(regionNeedle, input.region);
    if (regionLocationIds.length === 0) return [];
    filter.locationId = { $in: regionLocationIds };
  }

  const docs = await activitiesCollection()
    .find(filter)
    .sort({ startAt: 1 })
    .limit(Math.min(input.limit * 2, 50))
    .toArray();

  const visible = docs.filter(
    (doc) => !shouldHideActivityFromExploreMap(doc.joinMode, doc.requirements)
  );

  const locations = await loadLocationsByIds(visible.map((doc) => doc.locationId));

  return visible.slice(0, input.limit).map((doc) => {
    const location = locations.get(doc.locationId);
    const countryCode = location?.countryCode ?? 'AE';
    const local = formatActivityLocal(doc.startAt, countryCode);
    const locationName = location?.name ?? null;
    const region = location?.region ?? null;
    const title = doc.title?.trim() || locationName?.trim() || 'Outdoor plan';
    return {
      kind: 'activity',
      id: doc._id,
      title,
      summary: activityPublicMetaDescription({
        activityType: String(doc.activityType ?? 'hiking').toLowerCase(),
        title: doc.title,
        locationName,
        region,
      }),
      url: absUrl(input.siteOrigin, `/activity/${doc._id}`),
      region,
      activityType: String(doc.activityType ?? 'hiking').toLowerCase(),
      date: local.date,
      time: local.time,
      placeKind: null,
    };
  });
};

export const searchPublishedPlacesForAgents = async (
  input: Pick<AgentDiscoverSearchInput, 'q' | 'region' | 'limit' | 'siteOrigin'>
): Promise<AgentDiscoverItemDTO[]> => {
  const needle = normalizeSearchRegexInput(input.q);
  if (!needle) return [];

  const filter: Record<string, unknown> = {
    status: LocationStatus.ACTIVE,
    registryListed: { $ne: false },
    $or: [
      { name: { $regex: needle, $options: 'i' } },
      { region: { $regex: needle, $options: 'i' } },
      { description: { $regex: needle, $options: 'i' } },
    ],
  };
  const regionClause = buildRegionClause(input.region, 'region');
  if (regionClause) Object.assign(filter, regionClause);

  const docs = await locationsCollection()
    .find(filter)
    .sort({ featured: -1, viewCount: -1, name: 1 })
    .limit(input.limit * 2)
    .toArray();

  const placeRows = docs.filter((doc) => {
    const kind = placeKindFromLocationRow({
      activityType: String(doc.activityType ?? ''),
      tags: doc.tags ?? [],
    });
    return !isFacilityPlaceKind(kind);
  });

  return placeRows.slice(0, input.limit).map((doc) => ({
    kind: 'place',
    id: doc._id,
    title: doc.name,
    summary: (doc.description ?? '').trim().slice(0, 200) || `Outdoor place in ${doc.region ?? 'UAE'}.`,
    url: absUrl(input.siteOrigin, placePath({ id: doc._id, activityType: String(doc.activityType) })),
    region: doc.region ?? null,
    activityType: null,
    date: null,
    time: null,
    placeKind: placeKindWire(String(doc.activityType)),
  }));
};

export const runAgentDiscoverSearch = async (
  input: AgentDiscoverSearchInput
): Promise<AgentDiscoverResponseDTO> => {
  const perKind = Math.max(1, Math.ceil(input.limit / input.kinds.length));
  const results: AgentDiscoverItemDTO[] = [];

  if (input.kinds.includes('activity')) {
    results.push(...(await searchPublishedActivitiesForAgents({ ...input, limit: perKind })));
  }
  if (input.kinds.includes('place')) {
    results.push(...(await searchPublishedPlacesForAgents({ ...input, limit: perKind })));
  }

  return {
    schema_version: '1.0',
    query: input.q.trim(),
    total: results.length,
    results: results.slice(0, input.limit),
  };
};
