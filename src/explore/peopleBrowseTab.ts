/** People panel — Available · Friends going · Everyone (directory). */
export type PeopleBrowseTab = 'available' | 'going' | 'connect';

export const PEOPLE_BROWSE_TAB_LABELS: Record<PeopleBrowseTab, string> = {
  available: 'Available',
  going: 'Friends going',
  connect: 'Everyone',
};

export const parsePeopleBrowseTab = (raw: string | null): PeopleBrowseTab => {
  if (raw === 'available' || raw === 'going' || raw === 'connect') return raw;
  if (raw === 'all') return 'connect';
  if (raw === 'friends' || raw === 'followed') return 'going';
  if (raw === 'discover' || raw === 'looking') return 'available';
  return 'available';
};

/** URL `peopleTab` — omit default Available. */
export const serializePeopleBrowseTab = (tab: PeopleBrowseTab): string | null =>
  tab === 'available' ? null : tab;

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
  return 'available';
};
