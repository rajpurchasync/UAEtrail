import { mapInboundPeopleBrowseTabValue } from '../routing/productUrlInbound';

/** People panel — Looking for · Free · Friends · Everyone (directory). List crews adds `hub` overview. */
export type PeopleBrowseTab = 'hub' | 'looking' | 'available' | 'going' | 'connect';

export const PEOPLE_BROWSE_TAB_ORDER: PeopleBrowseTab[] = [
  'looking',
  'available',
  'going',
  'connect',
];

export const PEOPLE_BROWSE_TAB_LABELS: Record<PeopleBrowseTab, string> = {
  hub: 'Overview',
  looking: 'Looking for',
  available: 'Free',
  going: 'Friends',
  connect: 'Everyone',
};

export const parsePeopleBrowseTab = (raw: string | null): PeopleBrowseTab => {
  if (!raw) return 'looking';
  if (raw === 'hub') return 'hub';
  if (raw === 'looking' || raw === 'available' || raw === 'going' || raw === 'connect') return raw;
  const mapped = mapInboundPeopleBrowseTabValue(raw);
  if (mapped === 'hub' || mapped === 'looking' || mapped === 'available' || mapped === 'going' || mapped === 'connect') {
    return mapped;
  }
  return 'looking';
};

/** URL `peopleTab` — omit default Looking for. */
export const serializePeopleBrowseTab = (tab: PeopleBrowseTab): string | null =>
  tab === 'looking' ? null : tab;
