/** Available tab — flexible calendar vs fixed time/place (map listing is internal). */
export type CrewsAvailabilityShapeFilter = 'all' | 'flexible' | 'fixed';

export const CREWS_OPEN_URL_PARAM = 'open';

export const CREWS_AVAILABILITY_SHAPE_ORDER: CrewsAvailabilityShapeFilter[] = [
  'all',
  'flexible',
  'fixed',
];

export const parseCrewsAvailabilityShapeFilter = (
  raw: string | null
): CrewsAvailabilityShapeFilter => {
  if (raw === 'flexible' || raw === 'marked') return 'flexible';
  if (raw === 'fixed' || raw === 'open' || raw === 'looking') return 'fixed';
  return 'all';
};

export const serializeCrewsAvailabilityShapeFilter = (
  filter: CrewsAvailabilityShapeFilter
): string | null => (filter === 'all' ? null : filter);

/** Legacy deep link — opens availability compose via `ListDiscoveryExperience`. */
export const CREWS_AVAILABILITY_SHEET_PARAM = 'availability';

export const parseCrewsAvailabilitySheetOpen = (raw: string | null): boolean => raw === '1';

/** Available tab — filter calendar rows by intent `guide` kind (not directory pro profiles). */
export type CrewsAvailabilityGuideFilter = 'all' | 'guide';

export const CREWS_AVAIL_GUIDE_PARAM = 'availGuide';

export const parseCrewsAvailabilityGuideFilter = (raw: string | null): CrewsAvailabilityGuideFilter =>
  raw === 'guide' ? 'guide' : 'all';

export const serializeCrewsAvailabilityGuideFilter = (
  filter: CrewsAvailabilityGuideFilter
): string | null => (filter === 'guide' ? 'guide' : null);