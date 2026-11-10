const storageKey = (pageKey: string) => `uaetrail:detail-sections:${pageKey}`;

const readMap = (pageKey: string): Record<string, boolean> | null => {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(pageKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Record<string, boolean>;
  } catch {
    return null;
  }
};

/** First visit: `fallback`. Return visit same activity in this tab: stored toggle. */
export const readPersistedDetailSectionExpanded = (
  pageKey: string,
  sectionId: string,
  fallback: boolean
): boolean => {
  const map = readMap(pageKey);
  if (!map || !(sectionId in map)) return fallback;
  return Boolean(map[sectionId]);
};

export const writePersistedDetailSectionExpanded = (
  pageKey: string,
  sectionId: string,
  expanded: boolean
): void => {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const map = readMap(pageKey) ?? {};
    map[sectionId] = expanded;
    sessionStorage.setItem(storageKey(pageKey), JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
};
