import { Accessibility, Difficulty } from '../domain/enums.js';
import type { LocationCreateInput } from './entity-builders.js';
import type { VenueCatalogEntry } from './venue-catalog.js';
import { curatedAreaSeedId, type CuratedAreaSeedKey } from '@uaetrail/shared-types';

const HIKING_HERO =
  'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800';
const CAMPING_HERO =
  'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800';

const textBlob = (entry: VenueCatalogEntry): string =>
  `${entry.name} ${entry.description ?? ''}`.toLowerCase();

const inferRemote = (entry: VenueCatalogEntry): boolean =>
  /summit|stairway|4x4|desert|remote|dune|fossil|badayer|mleiha|remah/i.test(textBlob(entry));

const inferEasyHike = (entry: VenueCatalogEntry): boolean =>
  /loop|walk|dam|beach|corniche|lake|mangrove|hub|park|kayak|track/i.test(textBlob(entry));

const inferHardHike = (entry: VenueCatalogEntry): boolean =>
  /summit|stairway|heaven|mountain trail|ridge|abadilah/i.test(textBlob(entry));

const inferAreaLabel = (entry: VenueCatalogEntry): string | null => {
  if (entry.areaLabel?.trim()) return entry.areaLabel.trim();
  const id = entry.id;
  if (id.includes('jebel-jais')) return 'Jebel Jais';
  if (id.includes('wadi-shawka')) return 'Wadi Shawka';
  if (id.includes('hatta')) return 'Hatta';
  if (id.includes('mleiha') || id.includes('fossil-rock')) return 'Mleiha dunes';
  if (id.includes('al-badayer') || id.includes('big-red')) return 'Al Badayer dunes';
  if (id.includes('dibba')) return 'Dibba coast';
  if (id.includes('al-qudra') || id.includes('love-lake')) return 'Al Qudra';
  if (id.includes('khorfakkan')) return 'Khorfakkan corniche';
  if (id.includes('jumeirah') || id.includes('kite-beach')) return 'Kite Beach';
  if (id.includes('kalba')) return 'Kalba mangroves';
  if (id.includes('jebel-hafeet')) return 'Jebel Hafeet';
  if (id.includes('al-ain') || id.includes('remah')) return 'Remah dunes';
  return null;
};

export const resolveCatalogLocationAreaId = (locationId: string): string | null => {
  const key = resolveCatalogLocationAreaKey(locationId);
  return key ? curatedAreaSeedId(key) : null;
};

/** Prefix / explicit map for catalog venue ids → curated area seeds. */
export const resolveCatalogLocationAreaKey = (locationId: string): CuratedAreaSeedKey | null => {
  const explicit: Record<string, CuratedAreaSeedKey> = {
    'jebel-jais-summit-trail': 'jebelJais',
    'wadi-shawka-loop': 'wadiShawka',
    'fossil-rock-desert-camp': 'fossilRock',
    'dibba-beach-camp': 'dibba',
    'hatta-dam-loop': 'hatta',
    'mleiha-desert-camp': 'fossilRock',
    'al-badayer-desert-camp': 'fossilRock',
    'al-ain-desert-camp': 'remahDunes',
    'al-qudra-cycling-loop': 'alQudra',
    'love-lake-walk': 'loveLake',
    'jumeirah-kite-beach': 'jumeirah',
    'khorfakkan-beach-trail': 'khorfakkan',
    'jebel-hafeet-viewpoint-hike': 'jebelHafeet',
    'kalba-mangrove-kayak': 'kalba',
  };
  if (explicit[locationId]) return explicit[locationId];
  if (locationId.startsWith('jebel-jais')) return 'jebelJais';
  if (locationId.startsWith('wadi-shawka')) return 'wadiShawka';
  if (locationId.startsWith('hatta-')) return 'hatta';
  if (locationId.includes('mleiha') || locationId.includes('fossil-rock')) return 'fossilRock';
  if (locationId.includes('al-badayer') || locationId.includes('big-red')) return 'fossilRock';
  if (locationId.startsWith('dibba-')) return 'dibba';
  if (locationId.startsWith('al-qudra')) return 'alQudra';
  if (locationId.startsWith('love-lake')) return 'loveLake';
  if (locationId.startsWith('khorfakkan')) return 'khorfakkan';
  if (locationId.startsWith('jumeirah')) return 'jumeirah';
  if (locationId.startsWith('kalba-')) return 'kalba';
  if (locationId.startsWith('jebel-hafeet')) return 'jebelHafeet';
  if (locationId.startsWith('al-ain') || locationId.includes('remah')) return 'remahDunes';
  return null;
};

/** Type-aware defaults — matches contribute / place detail fields when catalog JSON is sparse. */
export const enrichCatalogEntryFields = (
  entry: VenueCatalogEntry
): Partial<LocationCreateInput> => {
  const hiking = entry.activityType === 'hiking';
  const camping = entry.activityType === 'camping';
  const remote = inferRemote(entry);
  const easy = hiking && inferEasyHike(entry);
  const hard = hiking && inferHardHike(entry);

  const difficulty =
    entry.difficulty ??
    (hiking ? (hard ? Difficulty.HARD : easy ? Difficulty.EASY : Difficulty.MODERATE) : undefined);

  const accessibility =
    entry.accessibility ?? (remote ? Accessibility.REMOTE : Accessibility.CAR_ACCESSIBLE);

  const distance =
    entry.distance ??
    (hiking ? (easy ? 4 : hard ? 11 : 7) : undefined);

  const duration =
    entry.duration ??
    (hiking ? (easy ? 1.5 : hard ? 5 : 3) : undefined);

  const elevation =
    entry.elevation ??
    (hiking ? (hard ? 450 : easy ? 80 : 220) : undefined);

  const areaLabel = inferAreaLabel(entry);
  const images =
    entry.images && entry.images.length > 0
      ? entry.images
      : [hiking ? HIKING_HERO : CAMPING_HERO];

  const season = entry.season ?? (camping ? ['winter'] : ['winter', 'year-round']);

  const childFriendly =
    entry.childFriendly ?? (camping ? true : hiking ? easy || !hard : false);

  const surfaceType =
    entry.surfaceType ??
    (camping ? ['sand'] : hiking ? ['rocky', 'gravel'] : []);

  const accessibleBy =
    entry.accessibleBy ?? (remote ? ['4x4', 'car'] : ['car']);

  const campingType =
    entry.campingType ?? (camping ? (remote ? 'self-guided' : 'self-guided') : undefined);

  const maxGroupSize = entry.maxGroupSize ?? (camping ? 12 : undefined);

  const parkingLat = entry.parkingLat ?? entry.latitude;
  const parkingLng = entry.parkingLng ?? entry.longitude;

  const areaId = entry.areaId ?? resolveCatalogLocationAreaId(entry.id) ?? undefined;

  const tags = [...(entry.tags ?? [])];
  if (areaLabel && !tags.some((t) => t.startsWith('area:'))) {
    tags.push(`area:${areaLabel}`);
  }

  return {
    areaLabel,
    destinationId: areaId,
    difficulty,
    accessibility,
    distance,
    duration,
    elevation,
    images,
    season,
    childFriendly,
    surfaceType,
    accessibleBy,
    campingType,
    maxGroupSize,
    parkingLat,
    parkingLng,
    tags,
  };
};
