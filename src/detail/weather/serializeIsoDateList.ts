/** Stable `useEffect` key for ISO date lists (avoids refetch when array identity changes). */
export const serializeIsoDateList = (dates: readonly string[]): string => dates.join(',');
