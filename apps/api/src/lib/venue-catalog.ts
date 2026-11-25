import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ActivityType, LocationStatus } from '../domain/enums.js';
import type { Location } from '../domain/types.js';
import { buildLocationFromCreateInput, type LocationCreateInput } from './entity-builders.js';
import { fillMissingLocationFields } from './location-field-fill.js';
import { enrichCatalogEntryFields } from './venue-catalog-enrichment.js';
import {
  VENUE_NAME_AR_TAG_PREFIX,
  VENUE_NAME_EN_TAG_PREFIX,
} from './venue-display-names.js';

export const VENUE_CATALOG_EXTERNAL_SOURCE = 'catalog' as const;
export const CATALOG_IMPORT_TAG = 'catalog-import';
export const CATALOG_ADMIN_EDITED_TAG = 'catalog-admin-edited';

export const locationHasCatalogImportTag = (tags?: string[] | null): boolean =>
  Boolean(tags?.includes(CATALOG_IMPORT_TAG));

export const locationHasCatalogAdminEditedTag = (tags?: string[] | null): boolean =>
  Boolean(tags?.includes(CATALOG_ADMIN_EDITED_TAG));

export const withCatalogAdminEditedTag = (tags?: string[] | null): string[] => {
  const base = [...(tags ?? [])];
  if (!base.includes(CATALOG_IMPORT_TAG)) base.push(CATALOG_IMPORT_TAG);
  if (!base.includes(CATALOG_ADMIN_EDITED_TAG)) base.push(CATALOG_ADMIN_EDITED_TAG);
  return base;
};

export type VenueCatalogActivityType = 'hiking' | 'camping';

export type VenueCatalogEntry = {
  id: string;
  name: string;
  nameAr?: string;
  activityType: VenueCatalogActivityType;
  region: string;
  latitude: number;
  longitude: number;
  description?: string;
  featured?: boolean;
  placeHubLabel?: string;
  areaId?: string;
  difficulty?: 'easy' | 'moderate' | 'hard';
  distance?: number;
  duration?: number;
  elevation?: number;
  accessibility?: 'car-accessible' | 'remote';
  childFriendly?: boolean;
  maxGroupSize?: number;
  campingType?: 'self-guided' | 'operator-led';
  surfaceType?: string[];
  accessibleBy?: string[];
  season?: string[];
  images?: string[];
  parkingLat?: number;
  parkingLng?: number;
  tags?: string[];
};

export type VenueCatalogFile = {
  version: number;
  venues: VenueCatalogEntry[];
};

const catalogPath = (): string =>
  join(dirname(fileURLToPath(import.meta.url)), '../../data/uae-outdoor-venue-catalog.json');

export const loadVenueCatalog = (): VenueCatalogFile => {
  const raw = readFileSync(catalogPath(), 'utf8');
  const parsed = JSON.parse(raw) as VenueCatalogFile;
  if (!parsed?.venues || !Array.isArray(parsed.venues)) {
    throw new Error('Invalid venue catalog JSON — expected { venues: [] }');
  }
  return parsed;
};

const toActivityType = (kind: VenueCatalogActivityType): ActivityType =>
  kind === 'camping' ? ActivityType.CAMPING : ActivityType.HIKING;

export const buildCatalogLocationTags = (entry: VenueCatalogEntry): string[] => {
  const kind = entry.activityType === 'camping' ? 'camping' : 'hiking';
  const tags = [CATALOG_IMPORT_TAG, kind, `catalog:${entry.id}`];
  if (entry.name) tags.push(`${VENUE_NAME_EN_TAG_PREFIX}${entry.name.slice(0, 120)}`);
  if (entry.nameAr) tags.push(`${VENUE_NAME_AR_TAG_PREFIX}${entry.nameAr.slice(0, 120)}`);
  return tags;
};

const CATALOG_DESCRIPTION =
  'Outdoor place on UAE Trail — coordinates and copy are curated for hikers and campers. Add photos and trip details as the community grows.';

export const mapCatalogEntryToLocationCreateInput = (entry: VenueCatalogEntry): LocationCreateInput => {
  const enriched = enrichCatalogEntryFields(entry);
  const baseTags = buildCatalogLocationTags(entry);
  const extraTags = enriched.tags ?? [];
  const tags = [...new Set([...baseTags, ...extraTags])];

  return {
    name: entry.name,
    region: entry.region,
    activityType: toActivityType(entry.activityType),
    description: entry.description?.trim() || CATALOG_DESCRIPTION,
    status: LocationStatus.ACTIVE,
    featured: entry.featured ?? false,
    latitude: entry.latitude,
    longitude: entry.longitude,
    countryCode: 'AE',
    tags,
    registryListed: true,
    externalSource: VENUE_CATALOG_EXTERNAL_SOURCE,
    externalId: entry.id,
    ...enriched,
  };
};

let catalogEntryById: Map<string, VenueCatalogEntry> | null = null;

export const getVenueCatalogEntryById = (locationId: string): VenueCatalogEntry | null => {
  if (!catalogEntryById) {
    const { venues } = loadVenueCatalog();
    catalogEntryById = new Map(venues.map((entry) => [entry.id, entry]));
  }
  return catalogEntryById.get(locationId) ?? null;
};

const resolveCatalogLocationId = (location: Location): string | null => {
  const fromTag = location.tags?.find((tag) => tag.startsWith('catalog:'))?.slice('catalog:'.length);
  if (fromTag) return fromTag;
  if (location.externalSource === VENUE_CATALOG_EXTERNAL_SOURCE && location.externalId) {
    return location.externalId;
  }
  return getVenueCatalogEntryById(location.id) ? location.id : null;
};

/**
 * Explore map catalog reads Mongo only — venue JSON is for `import-venue-catalog` / migrations, not runtime overlay.
 * @deprecated No longer called from `discovery-catalog-builder`; kept for import tests and one-off backfills.
 */
export const isVenueCatalogRuntimeOverlayEnabled = (): boolean => false;

/** Fill sparse DB rows from curated JSON — import scripts/tests only; not wired on `GET /explore/map`. */
export const overlayCatalogDefaultsOnLocation = (location: Location): Location => {
  const catalogId = resolveCatalogLocationId(location);
  if (!catalogId) return location;
  const entry = getVenueCatalogEntryById(catalogId);
  if (!entry) return location;
  const built = buildLocationFromCreateInput(mapCatalogEntryToLocationCreateInput(entry), entry.id);
  return fillMissingLocationFields(location, built);
};
