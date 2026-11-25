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

export const formatVenueAreaTag = (placeHubLabel: string): string =>
  `${VENUE_AREA_TAG_PREFIX}${placeHubLabel.trim()}`;

/** Persist `placeHubLabel` on the location and keep `area:` tag in sync for tag-only readers. */
export const mergeVenueAreaTag = (tags: readonly string[], placeHubLabel?: string | null): string[] => {
  const withoutArea = tags.filter((tag) => !tag.startsWith(VENUE_AREA_TAG_PREFIX));
  const trimmed = placeHubLabel?.trim();
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

const FACILITY_TAG_PREFIX = 'facility:';

const AMENITY_CHIP_RULES: ReadonlyArray<{ test: RegExp; label: string }> = [
  { test: /toilet|restroom|\bwc\b/i, label: 'Toilet' },
  { test: /fuel|petrol|\bgas\b|adnoc/i, label: 'Fuel' },
  { test: /shop|store|market/i, label: 'Shop' },
];

const titleCaseAmenity = (value: string): string => {
  const short = value.split(/\s+at\s+|\s+~/i)[0]?.trim() || value;
  const clipped = short.length > 22 ? `${short.slice(0, 20).trim()}…` : short;
  return clipped.charAt(0).toUpperCase() + clipped.slice(1);
};

/** On-site `facility:` tags as short list chips — not `nearby:` distances. */
export const readVenueAmenityChipLabels = (tags?: string[] | null): string[] => {
  if (!tags?.length) return [];
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag.toLowerCase().startsWith(FACILITY_TAG_PREFIX)) continue;
    const value = tag.slice(FACILITY_TAG_PREFIX.length).trim();
    if (!value) continue;
    const rule = AMENITY_CHIP_RULES.find((entry) => entry.test.test(value));
    const label = rule?.label ?? titleCaseAmenity(value);
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }
  return labels.slice(0, 4);
};

/** Explore peek / list: English title when available, Arabic (+ region) as subtitle. */
export const resolveVenueExploreLabels = (
  storedName: string,
  tags?: string[] | null,
  region?: string | null,
  placeHubLabel?: string | null
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
  const areaLine = placeHubLabel?.trim() || readVenueAreaFromTags(tags) || null;

  const subtitle = arabicLine
    ? regionPart
      ? `${arabicLine} · ${regionPart}`
      : arabicLine
    : areaLine ?? regionPart;

  return { title, subtitle };
};
