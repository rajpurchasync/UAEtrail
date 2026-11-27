import { PlaceDTO, tagsForPlaceKind, type PlaceKind } from '@uaetrail/shared-types';
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY } from '../../config/regions';
import { LOCATION_TYPE_LABELS } from '../../config/activityTypes';

export const HIKING_SURFACES = ['Stairs', 'Boulders', 'Steep hike', 'Rocks', 'Sandy', 'Gravel'];
export const CAMPING_SURFACES = ['Sand', 'Grass', 'Rocky', 'Mixed terrain'];
export const HIKING_ACCESSIBLE = ['4X4 required', 'Any cars', 'Bike'];
export const CAMPING_ACCESSIBLE = ['4X4 required', 'Any cars'];
export const TAG_OPTIONS = [
  'Child-free',
  'Pet-friendly',
  'Family-friendly',
  'Solo-friendly',
  'Wheelchair-accessible',
  'Night-hiking',
  'Sunrise spot',
  'Sunset spot',
];

export const SEASONS = ['winter', 'spring', 'summer', 'autumn', 'year-round'];

export const PLACE_DETAIL_STEPS = [
  { id: 'identity', label: 'Identity' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'media', label: 'Pin & media' },
  { id: 'publish', label: 'Publish' },
];

export const COUNTRY_OPTIONS = SUPPORTED_COUNTRIES.map((country) => ({
  value: country.code,
  label: country.label,
}));

export const LOCATION_STATUS_OPTIONS = [
  { value: 'draft' as const, label: 'Draft' },
  { value: 'active' as const, label: 'Active (Published)' },
  { value: 'inactive' as const, label: 'Inactive' },
];

export const PLACE_STATUS_FILTER_OPTIONS = [
  { value: 'draft' as const, label: 'Draft / pending' },
  { value: 'active' as const, label: 'Active' },
  { value: 'inactive' as const, label: 'Inactive' },
];

export const FEATURED_FILTER_OPTIONS = [
  { value: 'yes' as const, label: 'Featured' },
  { value: 'no' as const, label: 'Not featured' },
];

export const isTrailLike = (type?: PlaceDTO['activityType']) => type === 'hiking' || type === 'event';

export const activityTypeLabel = (type: PlaceDTO['activityType']) => {
  if (type === 'hiking') return `🥾 ${LOCATION_TYPE_LABELS.hiking}`;
  if (type === 'event') return `🏃 ${LOCATION_TYPE_LABELS.event}`;
  if (type === 'shop') return '🛍️ Shop (community pin)';
  return `⛺ ${LOCATION_TYPE_LABELS.camping}`;
};

export const activityTypeBadgeClass = (type: PlaceDTO['activityType']) => {
  if (type === 'hiking') return 'bg-emerald-50 text-emerald-700';
  if (type === 'event') return 'bg-violet-50 text-violet-700';
  if (type === 'shop') return 'bg-orange-50 text-orange-800';
  return 'bg-amber-50 text-amber-700';
};

export const emptyPlaceForm: Partial<PlaceDTO> = {
  name: '',
  region: '',
  activityType: 'hiking',
  description: '',
  difficulty: 'moderate',
  season: ['winter'],
  childFriendly: false,
  maxGroupSize: 20,
  accessibility: 'car-accessible',
  images: [],
  featured: false,
  status: 'draft',
  distance: undefined,
  duration: undefined,
  elevation: undefined,
  campingType: undefined,
  latitude: null,
  longitude: null,
  highlights: [],
  surfaceType: [],
  tags: [],
  parkingLink: '',
  accessibleBy: [],
  countryCode: DEFAULT_COUNTRY,
  gpxKey: null,
  guidePdfKey: null,
  guideMarkdown: '',
  guidePreview: '',
  unlockPriceAed: 29,
  parentPlaceId: null,
};

export const isCatalogMapPlace = (loc: Pick<PlaceDTO, 'tags'>): boolean =>
  loc.tags?.includes('catalog-import') ?? false;

export const parseOptionalNumberInput = (raw: string): number | undefined => {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const canApprovePlaceDraft = (loc: Partial<PlaceDTO>) => {
  const hikingOk =
    (loc.activityType !== 'hiking' && loc.activityType !== 'event') || Boolean(loc.difficulty);
  const parkingOk = Boolean(loc.parkingLink) || (loc.latitude != null && loc.longitude != null);
  return hikingOk && parkingOk;
};

export const buildCreateFacilityForm = (kind: PlaceKind): Partial<PlaceDTO> => ({
  ...emptyPlaceForm,
  activityType: 'event',
  tags: tagsForPlaceKind(kind),
});