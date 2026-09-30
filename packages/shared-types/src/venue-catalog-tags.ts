const ARABIC_SCRIPT = /[\u0600-\u06FF]/;

export const VENUE_NAME_AR_TAG_PREFIX = 'name-ar:';
export const VENUE_NAME_EN_TAG_PREFIX = 'name-en:';

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
  region?: string | null
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
  const subtitle = arabicLine
    ? regionPart
      ? `${arabicLine} · ${regionPart}`
      : arabicLine
    : regionPart;

  return { title, subtitle };
};
