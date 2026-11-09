/** Available tab sub-lens — looking for crew vs marked available days. */
export type CrewsAvailableOpenLens = 'all' | 'looking' | 'marked';

export const CREWS_OPEN_URL_PARAM = 'open';

export const parseCrewsAvailableOpenLens = (raw: string | null): CrewsAvailableOpenLens => {
  if (raw === 'looking' || raw === 'marked') return raw;
  return 'all';
};

export const serializeCrewsAvailableOpenLens = (lens: CrewsAvailableOpenLens): string | null =>
  lens === 'all' ? null : lens;

export const CREWS_AVAILABILITY_SHEET_PARAM = 'availability';

export const parseCrewsAvailabilitySheetOpen = (raw: string | null): boolean => raw === '1';
