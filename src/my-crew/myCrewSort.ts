/** Sort people rows by last activity (API `lastActiveAt`, else relationship timestamp). */
export const sortByLastActive = <T extends { lastActiveAt?: string | null }>(
  rows: T[],
  fallbackIso: (row: T) => string
): T[] =>
  [...rows].sort((a, b) => {
    const ta = Date.parse(a.lastActiveAt ?? fallbackIso(a) ?? '') || 0;
    const tb = Date.parse(b.lastActiveAt ?? fallbackIso(b) ?? '') || 0;
    return tb - ta || fallbackIso(a).localeCompare(fallbackIso(b));
  });