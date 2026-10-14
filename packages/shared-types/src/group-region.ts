/**
 * Hierarchical geography for map/list filters (country-agnostic wire model).
 *
 * | Level | Meaning (examples)        |
 * |-------|---------------------------|
 * | 1     | Country (ISO code, e.g. AE) |
 * | 2     | State / emirate             |
 * | 3     | City / locality             |
 * | 4     | District / part of city     |
 */

export const GROUP_REGION_LEVEL = {
  country: 1,
  state: 2,
  city: 3,
  district: 4,
} as const;

export type GroupRegionLevel = (typeof GROUP_REGION_LEVEL)[keyof typeof GROUP_REGION_LEVEL];

export type GroupRegionLevels = {
  l1: string | null;
  l2: string | null;
  l3: string | null;
  l4: string | null;
};

export const emptyGroupRegionLevels = (): GroupRegionLevels => ({
  l1: null,
  l2: null,
  l3: null,
  l4: null,
});

export const readGroupRegionAtLevel = (
  levels: GroupRegionLevels | null | undefined,
  level: GroupRegionLevel
): string | null => {
  if (!levels) return null;
  if (level === GROUP_REGION_LEVEL.country) return levels.l1?.trim() || null;
  if (level === GROUP_REGION_LEVEL.state) return levels.l2?.trim() || null;
  if (level === GROUP_REGION_LEVEL.city) return levels.l3?.trim() || null;
  return levels.l4?.trim() || null;
};

/** Explore/list region pill tier per country (UAE → L2 emirates). */
export const BROWSE_GROUP_REGION_FILTER_LEVEL_BY_COUNTRY: Record<string, GroupRegionLevel> = {
  AE: GROUP_REGION_LEVEL.state,
};

export const browseGroupRegionFilterLevel = (countryCode: string): GroupRegionLevel =>
  BROWSE_GROUP_REGION_FILTER_LEVEL_BY_COUNTRY[countryCode.trim().toUpperCase()] ??
  GROUP_REGION_LEVEL.state;

/** Indexed filter token at the country browse tier (e.g. UAE emirate pill key). */
export const resolveGroupRegionBrowseKey = (
  countryCode: string,
  levels: GroupRegionLevels | null | undefined
): string | null => readGroupRegionAtLevel(levels, browseGroupRegionFilterLevel(countryCode));

export const writeGroupRegionAtLevel = (
  levels: GroupRegionLevels,
  level: GroupRegionLevel,
  value: string | null
): GroupRegionLevels => {
  const trimmed = value?.trim() || null;
  if (level === GROUP_REGION_LEVEL.country) return { ...levels, l1: trimmed };
  if (level === GROUP_REGION_LEVEL.state) return { ...levels, l2: trimmed };
  if (level === GROUP_REGION_LEVEL.city) return { ...levels, l3: trimmed };
  return { ...levels, l4: trimmed };
};

/** Collect non-empty level values (deepest first) for search / display fallbacks. */
export const groupRegionLevelTexts = (levels: GroupRegionLevels | null | undefined): string[] => {
  if (!levels) return [];
  return [levels.l4, levels.l3, levels.l2, levels.l1].filter((v): v is string => Boolean(v?.trim()));
};

export type BuildGroupRegionLevelsInput = {
  countryCode: string;
  region?: string | null;
  areaLabel?: string | null;
  existing?: GroupRegionLevels | null;
  /** Level-2 hint (e.g. UAE emirate from form or legacy field). */
  stateHint?: string | null;
  resolvedState?: string | null;
  normalizeState?: (raw: string) => string | null;
};

/** Assemble L1–L4 from country, geo-resolved state, locality, and district. */
export const buildGroupRegionLevels = (input: BuildGroupRegionLevelsInput): GroupRegionLevels => {
  const normalize = input.normalizeState ?? ((raw: string) => raw.trim() || null);
  const l1 =
    input.existing?.l1?.trim() ||
    input.countryCode?.trim().toUpperCase() ||
    null;

  const hintedL2 = input.stateHint?.trim()
    ? normalize(input.stateHint)
    : null;
  const resolvedL2 = input.resolvedState?.trim() ? normalize(input.resolvedState) : null;
  const l2 = input.existing?.l2?.trim() || hintedL2 || resolvedL2 || null;

  const regionTrim = input.region?.trim() || null;
  const regionAsState = regionTrim ? normalize(regionTrim) : null;
  const l3 =
    input.existing?.l3?.trim() ||
    (regionTrim && regionAsState !== l2 && regionTrim !== l2 ? regionTrim : null) ||
    null;

  const l4 = input.existing?.l4?.trim() || input.areaLabel?.trim() || null;

  return { l1, l2, l3, l4 };
};

export const sameGroupRegionLevels = (
  a: GroupRegionLevels | null | undefined,
  b: GroupRegionLevels | null | undefined
): boolean => {
  const left = a ?? emptyGroupRegionLevels();
  const right = b ?? emptyGroupRegionLevels();
  return left.l1 === right.l1 && left.l2 === right.l2 && left.l3 === right.l3 && left.l4 === right.l4;
};
