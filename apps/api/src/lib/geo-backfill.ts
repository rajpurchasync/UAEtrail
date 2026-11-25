import type { AnyBulkWriteOperation, Db, Document } from 'mongodb';
import {
  CURATED_DESTINATION_CATALOG,
  GEO_AREA_AE_AL_AIN_ID,
  GEO_COUNTRY_AE_ID,
  GEO_LEGACY_AREA_OTHER_AL_AIN_ID,
  GEO_LEGACY_STATE_AE_AL_AIN_ID,
  GEO_STATE_AE_ABU_DHABI_ID,
  buildGeoSearchTokens,
  type GeoNodeDoc,
  type GeoPointWire,
  type GeoRef,
} from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { bumpGeoTreeVersion, invalidateGeoTree, loadGeoTree, otherAreaIdForState } from './geo-tree.js';
import { geoCacheInvalidate } from './geo-read-cache.js';
import { resolveGeoRefFromTree } from './geo-resolve.js';
import { distanceKm } from './geo-distance.js';
import { slugify } from './slug.js';

const UAE_STATES: Array<{
  slug: string;
  name: string;
  isoCode: string;
  center: [number, number];
  bbox: [number, number, number, number];
}> = [
  { slug: 'dubai', name: 'Dubai', isoCode: 'AE-DU', center: [55.27, 25.2], bbox: [54.9, 24.75, 56.22, 25.4] },
  { slug: 'abu-dhabi', name: 'Abu Dhabi', isoCode: 'AE-AZ', center: [54.37, 24.45], bbox: [51.5, 22.6, 56.05, 24.9] },
  { slug: 'sharjah', name: 'Sharjah', isoCode: 'AE-SH', center: [55.4, 25.35], bbox: [55.36, 24.88, 56.42, 25.64] },
  { slug: 'rak', name: 'RAK', isoCode: 'AE-RK', center: [56.0, 25.8], bbox: [55.7, 25.08, 56.4, 26.1] },
  { slug: 'fujairah', name: 'Fujairah', isoCode: 'AE-FU', center: [56.33, 25.12], bbox: [56.2, 24.85, 56.5, 25.7] },
  { slug: 'ajman', name: 'Ajman', isoCode: 'AE-AJ', center: [55.5, 25.4], bbox: [55.42, 24.78, 56.08, 25.46] },
  { slug: 'umm-al-quwain', name: 'Umm Al Quwain', isoCode: 'AE-UQ', center: [55.55, 25.55], bbox: [55.48, 25.48, 55.72, 25.62] },
];

/** Urban / named areas that may not exist in the published `areas` catalog. */
const EXTRA_GEO_AREAS: Array<{
  slug: string;
  name: string;
  stateSlug: string;
  center: [number, number];
  bbox: [number, number, number, number];
  sort: number;
}> = [
  { slug: 'downtown', name: 'Downtown Dubai', stateSlug: 'dubai', center: [55.2744, 25.1972], bbox: [55.26, 25.185, 55.292, 25.21], sort: 4 },
  { slug: 'dubai-marina', name: 'Dubai Marina', stateSlug: 'dubai', center: [55.1403, 25.0805], bbox: [55.125, 25.065, 55.16, 25.1], sort: 4 },
  { slug: 'jbr', name: 'JBR', stateSlug: 'dubai', center: [55.133, 25.078], bbox: [55.12, 25.068, 55.145, 25.09], sort: 3 },
  { slug: 'warsan-4', name: 'Warsan 4', stateSlug: 'dubai', center: [55.412, 25.162], bbox: [55.39, 25.148, 55.43, 25.178], sort: 8 },
  {
    slug: 'al-ain',
    name: 'Al Ain',
    stateSlug: 'abu-dhabi',
    center: [55.76, 24.21],
    bbox: [55.64, 24.13, 55.88, 24.32],
    sort: 2,
  },
];

const REGION_TO_STATE_SLUG: Record<string, string> = Object.fromEntries([
  ...UAE_STATES.flatMap((s) => [
    [s.name.toLowerCase(), s.slug],
    [s.slug, s.slug],
  ]),
  ['al ain', 'abu-dhabi'],
  ['alain', 'abu-dhabi'],
  ['al-ain', 'abu-dhabi'],
]);

const stateSlugForRegion = (region: string | null | undefined): string => {
  const key = String(region ?? '').trim().toLowerCase();
  return REGION_TO_STATE_SLUG[key] ?? REGION_TO_STATE_SLUG[key.replace(/\s+/g, '-')] ?? 'dubai';
};

const CURATED_GEO_VENUES: Array<{
  slug: string;
  name: string;
  aliases?: string[];
  areaSlug: string;
  center: [number, number];
  radiusM: number;
  sort: number;
}> = [
  { slug: 'hatta-dam', name: 'Hatta Dam', aliases: ['Hatta Kayak', 'Hatta Lake'], areaSlug: 'hatta', center: [56.1136, 24.7847], radiusM: 1100, sort: 0 },
  { slug: 'hatta-wadi-hub', name: 'Hatta Wadi Hub', aliases: ['Wadi Hub', 'Hatta Hiking Trails'], areaSlug: 'hatta', center: [56.148, 24.802], radiusM: 1100, sort: 1 },
  { slug: 'khatm-dam', name: 'Al Khattem Dam', aliases: ['Khatm Dam', 'Khatm Al Shikla Dam'], areaSlug: 'hatta', center: [56.14253, 24.81283], radiusM: 700, sort: 2 },
  { slug: 'al-qudra-lakes', name: 'Al Qudra Lakes', aliases: ['Al Qudra Cycle Track'], areaSlug: 'al-qudra', center: [55.5, 24.87], radiusM: 1800, sort: 0 },
  { slug: 'last-exit', name: 'Last Exit Al Qudra', aliases: ['Last Exit Camp'], areaSlug: 'al-qudra', center: [55.335, 24.865], radiusM: 900, sort: 1 },
  { slug: 'jebel-jais-summit', name: 'Jebel Jais Summit', aliases: ['Jais Summit'], areaSlug: 'jebel-jais', center: [56.273, 25.9545], radiusM: 1500, sort: 0 },
  { slug: 'jais-stairway', name: 'Stairway to Heaven', aliases: ['Jebel Jais Left Trail', 'Jebel Jais Right Trail'], areaSlug: 'jebel-jais', center: [56.175, 25.935], radiusM: 1800, sort: 1 },
  { slug: 'shawka-dam', name: 'Wadi Shawka Dam', aliases: ['Shawka Dam', 'Wadi Shawka Loop'], areaSlug: 'wadi-shawka', center: [56.12, 25.34], radiusM: 1400, sort: 0 },
  { slug: 'hafeet-summit', name: 'Jebel Hafeet Summit', aliases: ['Jebel Hafeet'], areaSlug: 'jebel-hafeet', center: [55.776, 24.057], radiusM: 1600, sort: 0 },
  { slug: 'kite-beach', name: 'Kite Beach', aliases: ['Jumeirah Beach'], areaSlug: 'jumeirah', center: [55.21, 25.168], radiusM: 900, sort: 0 },
  { slug: 'fossil-rock', name: 'Fossil Rock', aliases: ['Mleiha Fossil Rock'], areaSlug: 'fossil-rock', center: [55.8339, 25.1428], radiusM: 1200, sort: 0 },
];

const VENUE_NAME_HINT =
  /\b(dam|hub|park|beach|mall|lake|wadi|heritage|fort|corniche|plaza|village|harbour|harbor)\b/i;

const bboxFromRadius = (
  lng: number,
  lat: number,
  radiusM: number
): [number, number, number, number] => {
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return [lng - dLng, lat - dLat, lng + dLng, lat + dLat];
};

const polygonFromBbox = (bbox: [number, number, number, number]): GeoNodeDoc['geometry'] => {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return {
    type: 'Polygon',
    coordinates: [[
      [minLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [minLng, maxLat],
      [minLng, minLat],
    ]],
  };
};

const point = (lng: number, lat: number): GeoPointWire => ({ type: 'Point', coordinates: [lng, lat] });

const upsertNode = async (db: Db, doc: Omit<GeoNodeDoc, 'createdAt' | 'updatedAt'> & { createdAt?: Date }) => {
  const now = new Date();
  await db.collection<{ _id: string }>(COLLECTIONS.GEO_NODES).updateOne(
    { _id: doc._id },
    {
      $set: { ...doc, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
};

/** Seed country / emirates / Other areas + sync published catalog areas. Idempotent. */
export const seedGeoNodesFromCatalog = async (db: Db): Promise<void> => {
  const countryId = GEO_COUNTRY_AE_ID;
  await upsertNode(db, {
    _id: countryId,
    level: 1,
    kind: 'country',
    slug: 'ae',
    path: 'ae',
    names: { en: 'United Arab Emirates' },
    ancestors: [],
    center: point(54.5, 24.4),
    bbox: [51.5, 22.6, 56.6, 26.2],
    geometry: polygonFromBbox([51.5, 22.6, 56.6, 26.2]),
    childCount: UAE_STATES.length,
    sort: 0,
    status: 'active',
    isoCode: 'AE',
  });

  const stateIds = new Map<string, string>();
  for (const [i, s] of UAE_STATES.entries()) {
    const id = `geo-state-ae-${s.slug}`;
    stateIds.set(s.name.toLowerCase(), id);
    stateIds.set(s.slug, id);
    if (s.slug === 'abu-dhabi') {
      stateIds.set('al ain', id);
      stateIds.set('alain', id);
      stateIds.set('al-ain', id);
    }
    await upsertNode(db, {
      _id: id,
      level: 2,
      kind: 'state',
      slug: s.slug,
      path: `ae/${s.slug}`,
      names: { en: s.name },
      parentId: countryId,
      ancestors: [countryId],
      center: point(s.center[0], s.center[1]),
      bbox: s.bbox,
      geometry: polygonFromBbox(s.bbox),
      childCount: 1,
      sort: i,
      status: 'active',
      isoCode: s.isoCode,
    });
    const otherId = otherAreaIdForState(id);
    await upsertNode(db, {
      _id: otherId,
      level: 3,
      kind: 'area',
      slug: 'other',
      path: `ae/${s.slug}/other`,
      names: { en: 'Other' },
      parentId: id,
      ancestors: [countryId, id],
      center: point(s.center[0], s.center[1]),
      bbox: s.bbox,
      childCount: 0,
      sort: 999,
      status: 'active',
    });
  }

  const areas = await db
    .collection(COLLECTIONS.DESTINATIONS)
    .find({ status: 'published' })
    .toArray();
  for (const [i, area] of areas.entries()) {
    const region = String(area.region ?? '').toLowerCase();
    const stateSlug = stateSlugForRegion(area.region as string);
    const stateId =
      stateIds.get(region) ??
      stateIds.get(slugify(String(area.region ?? ''))) ??
      stateIds.get(stateSlug) ??
      stateIds.get('dubai') ??
      `geo-state-ae-dubai`;
    const state = UAE_STATES.find((s) => `geo-state-ae-${s.slug}` === stateId) ?? UAE_STATES[0];
    const ring = (area.bounds as Array<{ latitude: number; longitude: number }> | undefined) ?? [];
    const lngs = ring.map((p) => p.longitude);
    const lats = ring.map((p) => p.latitude);
    const bbox: [number, number, number, number] =
      lngs.length && lats.length
        ? [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
        : state.bbox;
    const geometry =
      ring.length >= 3
        ? {
            type: 'Polygon' as const,
            coordinates: [[...ring.map((p) => [p.longitude, p.latitude]), [ring[0].longitude, ring[0].latitude]]],
          }
        : polygonFromBbox(bbox);
    const id = String(area._id);
    await upsertNode(db, {
      _id: id,
      level: 3,
      kind: 'area',
      slug: String(area.slug),
      path: `ae/${state.slug}/${String(area.slug)}`,
      names: { en: String(area.name) },
      parentId: stateId,
      ancestors: [countryId, stateId],
      center: point(
        Number(area.center?.longitude ?? (bbox[0] + bbox[2]) / 2),
        Number(area.center?.latitude ?? (bbox[1] + bbox[3]) / 2)
      ),
      bbox,
      geometry,
      childCount: 0,
      sort: Number(area.priority ?? i),
      status: 'active',
      catalogAreaId: id,
    });
  }

  await seedExtraGeoAreasAndVenues(db, countryId);
  await demoteLegacyAlAinState(db, countryId);
  await recountGeoChildCounts(db);

  await db.collection<{ _id: string }>(COLLECTIONS.GEO_META).updateOne(
    { _id: 'tree' },
    { $setOnInsert: { treeVersion: 1, updatedAt: new Date() } },
    { upsert: true }
  );
  invalidateGeoTree();
  await geoCacheInvalidate();
};

const seedExtraGeoAreasAndVenues = async (db: Db, countryId: string): Promise<void> => {
  const nodes = db.collection<GeoNodeDoc>(COLLECTIONS.GEO_NODES);
  for (const curated of CURATED_DESTINATION_CATALOG) {
    const stateSlug = stateSlugForRegion(curated.region);
    const stateId = `geo-state-ae-${stateSlug}`;
    const existing = await db.collection(COLLECTIONS.GEO_NODES).findOne({
      kind: 'area',
      slug: curated.slug,
      status: 'active',
    });
    if (existing) continue;
    const bbox: [number, number, number, number] = [
      curated.bbox.west,
      curated.bbox.south,
      curated.bbox.east,
      curated.bbox.north,
    ];
    await upsertNode(db, {
      _id: curated.id,
      level: 3,
      kind: 'area',
      slug: curated.slug,
      path: `ae/${stateSlug}/${curated.slug}`,
      names: { en: curated.name },
      parentId: stateId,
      ancestors: [countryId, stateId],
      center: point(curated.center.longitude, curated.center.latitude),
      bbox,
      geometry: polygonFromBbox(bbox),
      childCount: 0,
      sort: curated.priority,
      status: 'active',
      catalogAreaId: curated.id,
    });
  }

  const catalogSlugs = new Set(CURATED_DESTINATION_CATALOG.map((row) => row.slug));
  for (const area of EXTRA_GEO_AREAS) {
    if (catalogSlugs.has(area.slug)) continue;
    const stateId = `geo-state-ae-${area.stateSlug}`;
    const state = UAE_STATES.find((s) => s.slug === area.stateSlug);
    if (!state) continue;
    const id =
      area.slug === 'al-ain' && area.stateSlug === 'abu-dhabi'
        ? GEO_AREA_AE_AL_AIN_ID
        : `geo-area-ae-${area.stateSlug}-${area.slug}`;
    await upsertNode(db, {
      _id: id,
      level: 3,
      kind: 'area',
      slug: area.slug,
      path: `ae/${area.stateSlug}/${area.slug}`,
      names: { en: area.name },
      parentId: stateId,
      ancestors: [countryId, stateId],
      center: point(area.center[0], area.center[1]),
      bbox: area.bbox,
      geometry: polygonFromBbox(area.bbox),
      childCount: 0,
      sort: area.sort,
      status: 'active',
    });
  }

  const areas = await nodes.find({ kind: 'area', status: 'active' }).toArray();
  const areaBySlug = new Map<string, GeoNodeDoc>();
  for (const area of areas) {
    if (area.slug === 'other') continue;
    if (!areaBySlug.has(area.slug)) areaBySlug.set(area.slug, area);
  }

  for (const venue of CURATED_GEO_VENUES) {
    const area = areaBySlug.get(venue.areaSlug);
    if (!area) continue;
    const bbox = bboxFromRadius(venue.center[0], venue.center[1], venue.radiusM);
    const id = `geo-venue-${venue.areaSlug}-${venue.slug}`;
    await upsertNode(db, {
      _id: id,
      level: 4,
      kind: 'venue',
      slug: venue.slug,
      path: `${area.path}/${venue.slug}`,
      names: { en: venue.name },
      parentId: String(area._id),
      ancestors: [...area.ancestors, String(area._id)],
      center: point(venue.center[0], venue.center[1]),
      bbox,
      geometry: polygonFromBbox(bbox),
      radiusM: venue.radiusM,
      childCount: 0,
      sort: venue.sort,
      status: 'active',
      aliases: venue.aliases,
    });
  }
};

const rewritePathAlAinState = (path: string, areaSlug?: string): string => {
  if (path === 'ae/al-ain' || path === 'ae/al-ain/other') return 'ae/abu-dhabi/al-ain';
  if (path.startsWith('ae/al-ain/other/')) return `ae/abu-dhabi/al-ain/${path.slice('ae/al-ain/other/'.length)}`;
  if (path.startsWith('ae/al-ain/')) {
    const rest = path.slice('ae/al-ain/'.length);
    return areaSlug ? `ae/abu-dhabi/${areaSlug}/${rest}` : `ae/abu-dhabi/${rest}`;
  }
  return path;
};

const uniqueIds = (ids: string[]): string[] => {
  const out: string[] = [];
  for (const id of ids) {
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
};

const rewriteGeoRefOffAlAinState = (geoRef: GeoRef | null | undefined): GeoRef | null => {
  if (!geoRef) return null;
  const hadLegacy =
    geoRef.stateId === GEO_LEGACY_STATE_AE_AL_AIN_ID ||
    geoRef.areaId === GEO_LEGACY_STATE_AE_AL_AIN_ID ||
    geoRef.areaId === GEO_LEGACY_AREA_OTHER_AL_AIN_ID ||
    geoRef.chain.includes(GEO_LEGACY_STATE_AE_AL_AIN_ID) ||
    geoRef.chain.includes(GEO_LEGACY_AREA_OTHER_AL_AIN_ID);
  if (!hadLegacy) return null;

  const otherWasArea =
    geoRef.areaId === GEO_LEGACY_AREA_OTHER_AL_AIN_ID ||
    geoRef.areaId === GEO_LEGACY_STATE_AE_AL_AIN_ID ||
    geoRef.chain.includes(GEO_LEGACY_AREA_OTHER_AL_AIN_ID);

  const chain = uniqueIds(
    geoRef.chain.flatMap((id) => {
      if (id === GEO_LEGACY_STATE_AE_AL_AIN_ID) return [GEO_STATE_AE_ABU_DHABI_ID];
      if (id === GEO_LEGACY_AREA_OTHER_AL_AIN_ID) return [GEO_AREA_AE_AL_AIN_ID];
      return [id];
    })
  );
  if (otherWasArea && !chain.includes(GEO_AREA_AE_AL_AIN_ID)) {
    const stateAt = chain.indexOf(GEO_STATE_AE_ABU_DHABI_ID);
    if (stateAt >= 0) chain.splice(stateAt + 1, 0, GEO_AREA_AE_AL_AIN_ID);
    else chain.push(GEO_AREA_AE_AL_AIN_ID);
  }

  const names = {
    ...geoRef.names,
    state: geoRef.names.state.trim().toLowerCase() === 'al ain' ? 'Abu Dhabi' : geoRef.names.state,
    area:
      otherWasArea || geoRef.names.area.trim().toLowerCase() === 'other'
        ? 'Al Ain'
        : geoRef.names.area,
  };
  if (names.state.trim().toLowerCase() === 'al ain') names.state = 'Abu Dhabi';

  return {
    ...geoRef,
    chain,
    countryId: geoRef.countryId || GEO_COUNTRY_AE_ID,
    stateId: GEO_STATE_AE_ABU_DHABI_ID,
    areaId: otherWasArea ? GEO_AREA_AE_AL_AIN_ID : geoRef.areaId,
    path: rewritePathAlAinState(geoRef.path),
    names,
    searchTokens: buildGeoSearchTokens(names),
  };
};

/** Hide Al Ain-as-emirate leftover and re-parent its children under Abu Dhabi. Idempotent. */
const demoteLegacyAlAinState = async (db: Db, countryId: string): Promise<number> => {
  const col = db.collection<GeoNodeDoc>(COLLECTIONS.GEO_NODES);
  const abuDhabi = await col.findOne({ _id: GEO_STATE_AE_ABU_DHABI_ID });
  const alAinArea = await col.findOne({ _id: GEO_AREA_AE_AL_AIN_ID });
  if (!abuDhabi || !alAinArea) return 0;

  let moved = 0;
  const kids = await col
    .find({
      $or: [
        { parentId: GEO_LEGACY_STATE_AE_AL_AIN_ID },
        { ancestors: GEO_LEGACY_STATE_AE_AL_AIN_ID },
      ],
    })
    .toArray();

  const areaKids = kids.filter((kid) => kid.kind === 'area');
  const venueKids = kids.filter((kid) => kid.kind === 'venue');

  for (const kid of areaKids) {
    const id = String(kid._id);
    if (id === GEO_AREA_AE_AL_AIN_ID) continue;
    if (id === GEO_LEGACY_AREA_OTHER_AL_AIN_ID || kid.slug === 'other') {
      await col.updateOne(
        { _id: id },
        {
          $set: {
            status: 'hidden',
            parentId: GEO_AREA_AE_AL_AIN_ID,
            ancestors: [countryId, GEO_STATE_AE_ABU_DHABI_ID, GEO_AREA_AE_AL_AIN_ID],
            path: 'ae/abu-dhabi/al-ain/other',
            updatedAt: new Date(),
          },
        }
      );
      moved += 1;
      continue;
    }
    await col.updateOne(
      { _id: id },
      {
        $set: {
          parentId: GEO_STATE_AE_ABU_DHABI_ID,
          ancestors: [countryId, GEO_STATE_AE_ABU_DHABI_ID],
          path: `ae/abu-dhabi/${kid.slug}`,
          level: 3,
          updatedAt: new Date(),
        },
      }
    );
    moved += 1;
  }

  for (const kid of venueKids) {
    const id = String(kid._id);
    const parentIsLegacyState = kid.parentId === GEO_LEGACY_STATE_AE_AL_AIN_ID;
    const parentIsLegacyOther = kid.parentId === GEO_LEGACY_AREA_OTHER_AL_AIN_ID;
    const areaParentId =
      parentIsLegacyState || parentIsLegacyOther
        ? GEO_AREA_AE_AL_AIN_ID
        : String(kid.parentId ?? GEO_AREA_AE_AL_AIN_ID);
    const areaParent = await col.findOne({ _id: areaParentId });
    const parentId =
      areaParent && areaParent.kind === 'area' ? String(areaParent._id) : GEO_AREA_AE_AL_AIN_ID;
    const ancestors =
      areaParent && areaParent.kind === 'area'
        ? [...areaParent.ancestors, String(areaParent._id)]
        : [countryId, GEO_STATE_AE_ABU_DHABI_ID, GEO_AREA_AE_AL_AIN_ID];
    const pathPrefix = areaParent?.path ?? 'ae/abu-dhabi/al-ain';
    await col.updateOne(
      { _id: id },
      {
        $set: {
          parentId,
          ancestors,
          path: `${pathPrefix}/${kid.slug}`,
          level: 4,
          updatedAt: new Date(),
        },
      }
    );
    moved += 1;
  }

  await col.updateMany(
    {
      $or: [
        { _id: GEO_LEGACY_STATE_AE_AL_AIN_ID },
        { kind: 'state', slug: 'al-ain' },
        { kind: 'state', isoCode: 'AE-AIN' },
      ],
    },
    { $set: { status: 'hidden', kind: 'state', updatedAt: new Date() } }
  );

  await db.collection(COLLECTIONS.DESTINATIONS).updateMany(
    { region: { $in: ['Al Ain', 'al ain', 'alain'] } },
    { $set: { region: 'Abu Dhabi' } }
  );

  return moved;
};

const staleAlAinGeoRefFilter = {
  $or: [
    { 'geoRef.stateId': GEO_LEGACY_STATE_AE_AL_AIN_ID },
    { 'geoRef.areaId': GEO_LEGACY_STATE_AE_AL_AIN_ID },
    { 'geoRef.areaId': GEO_LEGACY_AREA_OTHER_AL_AIN_ID },
    { 'geoRef.chain': GEO_LEGACY_STATE_AE_AL_AIN_ID },
    { 'geoRef.chain': GEO_LEGACY_AREA_OTHER_AL_AIN_ID },
  ],
};

const countLegacyAlAinRefs = async (db: Db, name: string): Promise<number> =>
  db.collection(name).countDocuments(staleAlAinGeoRefFilter);

const remapLegacyAlAinGeoRefs = async (db: Db, name: string): Promise<number> => {
  const col = db.collection(name);
  const cursor = col.find(staleAlAinGeoRefFilter).batchSize(200);
  let ops: AnyBulkWriteOperation<Document>[] = [];
  let n = 0;
  const flush = async () => {
    if (!ops.length) return;
    await col.bulkWrite(ops, { ordered: false });
    n += ops.length;
    ops = [];
  };
  for await (const doc of cursor) {
    const next = rewriteGeoRefOffAlAinState(doc.geoRef as GeoRef | undefined);
    if (!next) continue;
    const set: Document = { geoRef: next };
    if (doc.venueId !== undefined && next.venueId) set.venueId = next.venueId;
    if (typeof doc.region === 'string' && doc.region.trim().toLowerCase() === 'al ain') {
      set.region = 'Abu Dhabi';
    }
    ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: set } } });
    if (ops.length >= 500) await flush();
  }
  await flush();
  return n;
};

const recountGeoChildCounts = async (db: Db): Promise<void> => {
  const col = db.collection(COLLECTIONS.GEO_NODES);
  const nodes = await col.find({ status: 'active' }).project({ _id: 1, parentId: 1 }).toArray();
  const counts = new Map<string, number>();
  for (const node of nodes) {
    const parentId = typeof node.parentId === 'string' ? node.parentId : null;
    if (!parentId) continue;
    counts.set(parentId, (counts.get(parentId) ?? 0) + 1);
  }
  const ops: AnyBulkWriteOperation<Document>[] = nodes.map((node) => {
    const id = String(node._id);
    return {
      updateOne: {
        filter: { _id: id } as Document,
        update: { $set: { childCount: counts.get(id) ?? 0 } },
      },
    };
  });
  if (ops.length) await col.bulkWrite(ops, { ordered: false });
};

const cleanVenueName = (raw: string): string =>
  raw
    .replace(/\b(trail network|hiking trails|camping|camp spot|loop|trail|hike|camp)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const clusterAndSeedVenuesFromPins = async (db: Db): Promise<number> => {
  const index = await loadGeoTree(true);
  const locations = await db
    .collection(COLLECTIONS.LOCATIONS)
    .find({
      latitude: { $type: 'number' },
      longitude: { $type: 'number' },
    })
    .project({ name: 1, placeHubLabel: 1, areaId: 1, latitude: 1, longitude: 1, geoRef: 1 })
    .toArray();

  const used = new Set<string>();
  let created = 0;
  const maxNew = 60;

  for (const loc of locations) {
    const id = String(loc._id);
    if (used.has(id) || created >= maxNew) continue;
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const hints = {
      latitude: lat,
      longitude: lng,
      areaId: (loc.areaId as string) ?? null,
      countryCode: 'AE',
      region: null,
      venueName: (loc.name as string) ?? null,
    };
    const { geoRef } = resolveGeoRefFromTree(index, hints);
    if (!geoRef.areaId) continue;
    if (geoRef.venueId) {
      used.add(id);
      continue;
    }
    const area = index.byId.get(geoRef.areaId);
    if (!area || area.kind !== 'area' || area.slug === 'other') continue;

    const cluster = locations.filter((other) => {
      const oid = String(other._id);
      if (used.has(oid)) return false;
      const olat = Number(other.latitude);
      const olng = Number(other.longitude);
      if (!Number.isFinite(olat) || !Number.isFinite(olng)) return false;
      return distanceKm(lat, lng, olat, olng) <= 0.7;
    });
    const seedName = cleanVenueName(String(loc.placeHubLabel || loc.name || ''));
    const named = VENUE_NAME_HINT.test(seedName) || VENUE_NAME_HINT.test(String(loc.name ?? ''));
    if (cluster.length < 2 && !named) continue;

    const slugBase = slugify(seedName) || slugify(String(loc.name ?? '')) || `cluster-${id.slice(0, 8)}`;
    const venueSlug = slugBase.slice(0, 48);
    const venueId = `geo-venue-${area.slug}-${venueSlug}`;
    if (index.byId.has(venueId)) {
      used.add(id);
      continue;
    }

    const bbox = bboxFromRadius(lng, lat, 900);
    await upsertNode(db, {
      _id: venueId,
      level: 4,
      kind: 'venue',
      slug: venueSlug,
      path: `${area.path}/${venueSlug}`,
      names: { en: seedName || String(loc.name) },
      parentId: String(area._id),
      ancestors: [...area.ancestors, String(area._id)],
      center: point(lng, lat),
      bbox,
      geometry: polygonFromBbox(bbox),
      radiusM: 900,
      childCount: 0,
      sort: 50 + created,
      status: 'active',
      aliases: [String(loc.name)].filter(Boolean),
    });
    created += 1;
    for (const member of cluster) used.add(String(member._id));
  }

  if (created > 0) {
    invalidateGeoTree();
    await recountGeoChildCounts(db);
  }
  return created;
};

const backfillCollection = async (
  db: Db,
  name: string,
  pick: (doc: Document) => {
    latitude?: number | null;
    longitude?: number | null;
    areaId?: string | null;
    countryCode?: string | null;
    region?: string | null;
    venueName?: string | null;
    extraNames?: string[];
  },
  opts: { force?: boolean; setVenueId?: boolean } = {}
): Promise<number> => {
  const col = db.collection(name);
  const index = await loadGeoTree(true);
  const filter = opts.force
    ? {}
    : {
        $or: [
          { geoRef: { $exists: false } },
          { 'geoRef.areaId': { $in: [null, ''] } },
        ],
      };
  const cursor = col.find(filter).batchSize(200);
  let ops: AnyBulkWriteOperation<Document>[] = [];
  let n = 0;
  const flush = async () => {
    if (!ops.length) return;
    await col.bulkWrite(ops, { ordered: false });
    n += ops.length;
    ops = [];
  };
  for await (const doc of cursor) {
    const hints = pick(doc);
    const { geoRef } = resolveGeoRefFromTree(index, hints);
    const set: Document = { geoRef };
    if (opts.setVenueId) set.venueId = geoRef.venueId ?? null;
    ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: set } } });
    if (ops.length >= 500) await flush();
  }
  await flush();
  return n;
};

const tagFacilitiesToNearbyPlaces = async (db: Db): Promise<number> => {
  const facilities = await db
    .collection(COLLECTIONS.FACILITIES)
    .find({
      latitude: { $type: 'number' },
      longitude: { $type: 'number' },
      $or: [{ parentPlaceId: { $exists: false } }, { parentPlaceId: null }, { parentPlaceId: '' }],
    })
    .project({ latitude: 1, longitude: 1, geoRef: 1, parentPlaceId: 1 })
    .toArray();
  if (facilities.length === 0) return 0;

  const locations = await db
    .collection(COLLECTIONS.LOCATIONS)
    .find({ latitude: { $type: 'number' }, longitude: { $type: 'number' } })
    .project({ latitude: 1, longitude: 1, geoRef: 1 })
    .toArray();

  let n = 0;
  const ops: AnyBulkWriteOperation<Document>[] = [];
  for (const fac of facilities) {
    const lat = Number(fac.latitude);
    const lng = Number(fac.longitude);
    let bestId: string | null = null;
    let bestKm = 0.4;
    for (const loc of locations) {
      const km = distanceKm(lat, lng, Number(loc.latitude), Number(loc.longitude));
      if (km < bestKm) {
        bestKm = km;
        bestId = String(loc._id);
      }
    }
    if (!bestId) continue;
    ops.push({
      updateOne: {
        filter: { _id: fac._id },
        update: { $set: { parentPlaceId: bestId } },
      },
    });
    n += 1;
  }
  if (ops.length) await db.collection(COLLECTIONS.FACILITIES).bulkWrite(ops, { ordered: false });
  return n;
};

export const backfillGeoRefOnPins = async (
  db: Db,
  opts: { force?: boolean } = {}
): Promise<{ locations: number; activities: number; facilities: number }> => {
  await seedGeoNodesFromCatalog(db);
  const locations = await backfillCollection(
    db,
    COLLECTIONS.LOCATIONS,
    (doc) => ({
      latitude: doc.latitude as number | null,
      longitude: doc.longitude as number | null,
      areaId: (doc.areaId as string) ?? null,
      countryCode: (doc.countryCode as string) ?? 'AE',
      region: (doc.region as string) ?? null,
      venueName: (doc.name as string) ?? null,
      extraNames: [doc.name, doc.placeHubLabel].filter(Boolean) as string[],
    }),
    { force: opts.force }
  );
  const activities = await backfillCollection(
    db,
    COLLECTIONS.ACTIVITIES,
    (doc) => ({
      latitude: (doc.meetingLat ?? doc.startLat) as number | null,
      longitude: (doc.meetingLng ?? doc.startLng) as number | null,
      areaId: (doc.areaId as string) ?? null,
      countryCode: 'AE',
      region: null,
      venueName: (doc.meetingPoint as string) ?? (doc.title as string) ?? null,
      extraNames: [doc.title, doc.meetingPoint].filter(Boolean) as string[],
    }),
    { force: opts.force }
  );
  const facilities = await backfillCollection(
    db,
    COLLECTIONS.FACILITIES,
    (doc) => ({
      latitude: doc.latitude as number | null,
      longitude: doc.longitude as number | null,
      areaId: (doc.areaId as string) ?? null,
      countryCode: (doc.countryCode as string) ?? 'AE',
      region: (doc.region as string) ?? null,
      venueName: (doc.name as string) ?? null,
      extraNames: [doc.name].filter(Boolean) as string[],
    }),
    { force: opts.force, setVenueId: true }
  );
  return { locations, activities, facilities };
};

export type GeoHierarchyEnrichResult = {
  clusteredVenues: number;
  locations: number;
  activities: number;
  facilities: number;
  facilitiesPlaceTagged: number;
  nodes: { country: number; state: number; area: number; venue: number };
  pinsMissingArea: { locations: number; activities: number; facilities: number };
  alAin: {
    canonicalAreaId: string;
    legacyStateId: string;
    legacyRefsBefore: { locations: number; activities: number; facilities: number };
    retagged: { locations: number; activities: number; facilities: number };
  };
};

export const enrichGeoHierarchy = async (db: Db): Promise<GeoHierarchyEnrichResult> => {
  const alAinStaleRefsBefore = {
    locations: await countLegacyAlAinRefs(db, COLLECTIONS.LOCATIONS),
    activities: await countLegacyAlAinRefs(db, COLLECTIONS.ACTIVITIES),
    facilities: await countLegacyAlAinRefs(db, COLLECTIONS.FACILITIES),
  };
  await seedGeoNodesFromCatalog(db);
  const clusteredVenues = await clusterAndSeedVenuesFromPins(db);
  const patched = await backfillGeoRefOnPins(db, { force: true });
  const remapped = {
    locations: await remapLegacyAlAinGeoRefs(db, COLLECTIONS.LOCATIONS),
    activities: await remapLegacyAlAinGeoRefs(db, COLLECTIONS.ACTIVITIES),
    facilities: await remapLegacyAlAinGeoRefs(db, COLLECTIONS.FACILITIES),
  };
  const facilitiesPlaceTagged = await tagFacilitiesToNearbyPlaces(db);
  await bumpGeoTreeVersion();

  const nodesCol = db.collection(COLLECTIONS.GEO_NODES);
  const [country, state, area, venue] = await Promise.all([
    nodesCol.countDocuments({ kind: 'country', status: 'active' }),
    nodesCol.countDocuments({ kind: 'state', status: 'active' }),
    nodesCol.countDocuments({ kind: 'area', status: 'active' }),
    nodesCol.countDocuments({ kind: 'venue', status: 'active' }),
  ]);
  const missing = (name: string) =>
    db.collection(name).countDocuments({
      $or: [{ geoRef: { $exists: false } }, { 'geoRef.areaId': { $in: [null, ''] } }],
    });
  const [locMiss, actMiss, facMiss] = await Promise.all([
    missing(COLLECTIONS.LOCATIONS),
    missing(COLLECTIONS.ACTIVITIES),
    missing(COLLECTIONS.FACILITIES),
  ]);

  const leftover = {
    locations: await countLegacyAlAinRefs(db, COLLECTIONS.LOCATIONS),
    activities: await countLegacyAlAinRefs(db, COLLECTIONS.ACTIVITIES),
    facilities: await countLegacyAlAinRefs(db, COLLECTIONS.FACILITIES),
  };

  return {
    clusteredVenues,
    ...patched,
    facilitiesPlaceTagged,
    nodes: { country, state, area, venue },
    pinsMissingArea: { locations: locMiss, activities: actMiss, facilities: facMiss },
    alAin: {
      canonicalAreaId: GEO_AREA_AE_AL_AIN_ID,
      legacyStateId: GEO_LEGACY_STATE_AE_AL_AIN_ID,
      legacyRefsBefore: alAinStaleRefsBefore,
      retagged: {
        locations: Math.max(alAinStaleRefsBefore.locations - leftover.locations, remapped.locations),
        activities: Math.max(alAinStaleRefsBefore.activities - leftover.activities, remapped.activities),
        facilities: Math.max(alAinStaleRefsBefore.facilities - leftover.facilities, remapped.facilities),
      },
    },
  };
};
