const ARABIC_SCRIPT = /[\u0600-\u06FF]/;

export const VENUE_NAME_AR_TAG_PREFIX = 'name-ar:';
export const VENUE_NAME_EN_TAG_PREFIX = 'name-en:';
/** List / map subtitle when the trailhead or wadi name differs from `region`. */
export const VENUE_AREA_TAG_PREFIX = 'area:';

export const readVenueAreaFromTags = (tags?: string[] | null): string | null => {
  if (!tags) return null;
  const entry = tags.find((tag) => tag.startsWith(VENUE_AREA_TAG_PREFIX));
  if (!entry) return null;
  const value = entry.slice(VENUE_AREA_TAG_PREFIX.length).trim();
  return value.length >= 2 ? value : null;
};

export const formatVenueAreaTag = (areaLabel: string): string =>
  `${VENUE_AREA_TAG_PREFIX}${areaLabel.trim()}`;

/** Persist `areaLabel` on the location and keep `area:` tag in sync for legacy readers. */
export const mergeVenueAreaTag = (tags: readonly string[], areaLabel?: string | null): string[] => {
  const withoutArea = tags.filter((tag) => !tag.startsWith(VENUE_AREA_TAG_PREFIX));
  const trimmed = areaLabel?.trim();
  if (!trimmed || trimmed.length < 2) return [...withoutArea];
  const tag = formatVenueAreaTag(trimmed);
  return [...withoutArea, tag];
};

/** Map contribute / submit `accessibleBy` to catalog accessibility for list posters. */
export const deriveVenueAccessibilityFromAccessibleBy = (
  accessibleBy?: readonly string[] | null
): 'car-accessible' | 'remote' | undefined => {
  const values = (accessibleBy ?? []).map((v) => v.toLowerCase());
  const has4x4 = values.some((v) => v === '4x4');
  const hasCar = values.some((v) => v === 'car' || v === 'sedan');
  if (has4x4 && !hasCar) return 'remote';
  if (hasCar) return 'car-accessible';
  return undefined;
};

export const readVenueEnglishNameFromTags = (tags?: string[] | null): string | null => {
  if (!tags) return null;
  const entry = tags.find((tag) => tag.startsWith(VENUE_NAME_EN_TAG_PREFIX));
  if (!entry) return null;
  const value = entry.slice(VENUE_NAME_EN_TAG_PREFIX.length).trim();
  return value.length >= 2 ? value : null;
};

export const readVenueArabicNameFromTags = (tags?: string[] | null): string | null => {
  if (!tags) return null;
  const entry = tags.find((tag) => tag.startsWith(VENUE_NAME_AR_TAG_PREFIX));
  if (!entry) return null;
  const value = entry.slice(VENUE_NAME_AR_TAG_PREFIX.length).trim();
  return value.length >= 2 ? value : null;
};

export const resolvePlaceDisplayTitle = (storedName: string, tags?: string[] | null): string =>
  readVenueEnglishNameFromTags(tags) || storedName.trim() || 'Place';

/** Explore peek / list: English title when available, Arabic (+ region) as subtitle. */
export const resolveVenueExploreLabels = (
  storedName: string,
  tags?: string[] | null,
  region?: string | null,
  areaLabel?: string | null
): { title: string; subtitle: string | null } => {
  const trimmed = storedName.trim() || 'Place';
  const nameEn = readVenueEnglishNameFromTags(tags);
  const nameAr = readVenueArabicNameFromTags(tags);
  const storedIsArabic = ARABIC_SCRIPT.test(trimmed);

  const title = nameEn || trimmed;

  const arabicLine =
    nameAr && nameAr !== title
      ? nameAr
      : storedIsArabic && nameEn
        ? trimmed
        : null;

  const regionPart = region?.trim() || null;
  const areaLine = areaLabel?.trim() || readVenueAreaFromTags(tags) || null;

  const subtitle = arabicLine
    ? regionPart
      ? `${arabicLine} · ${regionPart}`
      : arabicLine
    : areaLine ?? regionPart;

  return { title, subtitle };
};
