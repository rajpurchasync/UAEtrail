/** Available tab sub-lens — map intent signals vs marked calendar days. */
export type CrewsAvailableOpenLens = 'all' | 'open' | 'marked';

export const CREWS_OPEN_URL_PARAM = 'open';

export const parseCrewsAvailableOpenLens = (raw: string | null): CrewsAvailableOpenLens => {
  if (raw === 'open' || raw === 'looking') return 'open';
  if (raw === 'marked') return 'marked';
  return 'all';
};

export const serializeCrewsAvailableOpenLens = (lens: CrewsAvailableOpenLens): string | null =>
  lens === 'all' ? null : lens;

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