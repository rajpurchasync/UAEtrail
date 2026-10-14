/** People panel — Looking for · Free · Friends · Everyone (directory). */
export type PeopleBrowseTab = 'looking' | 'available' | 'going' | 'connect';

export const PEOPLE_BROWSE_TAB_ORDER: PeopleBrowseTab[] = [
  'looking',
  'available',
  'going',
  'connect',
];

export const PEOPLE_BROWSE_TAB_LABELS: Record<PeopleBrowseTab, string> = {
  looking: 'Looking for',
  available: 'Free',
  going: 'Friends',
  connect: 'Everyone',
};

export const parsePeopleBrowseTab = (raw: string | null): PeopleBrowseTab => {
  if (raw === 'looking' || raw === 'available' || raw === 'going' || raw === 'connect') return raw;
  if (raw === 'all') return 'connect';
  if (raw === 'friends' || raw === 'followed') return 'going';
  if (raw === 'discover') return 'available';
  return 'looking';
};

/** URL `peopleTab` — omit default Looking for. */
export const serializePeopleBrowseTab = (tab: PeopleBrowseTab): string | null =>
  tab === 'looking' ? null : tab;

/**
 * Explore map/list URL: `peopleTab` / `socialTab` plus legacy `goingTab` when `view=going`.
 */
export const parsePeopleBrowseTabFromUrl = (
  peopleTab: string | null,
  legacyGoingTab: string | null
): PeopleBrowseTab => {
  if (peopleTab) return parsePeopleBrowseTab(peopleTab);
  if (legacyGoingTab === 'people') return 'going';
  if (legacyGoingTab === 'discover') return 'available';
  if (legacyGoingTab === 'trips') return 'connect';
  return 'looking';
};
