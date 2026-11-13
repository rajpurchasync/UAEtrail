const normalizeLeadText = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Hide emerald subtitle when it repeats the H1 or the linked place card already covers it. */
export const shouldShowActivityDetailLeadVenue = (
  title: string,
  venueLabel: string | null | undefined,
  hasLinkedPlaceCard: boolean
): boolean => {
  const venue = venueLabel?.trim();
  if (!venue || hasLinkedPlaceCard) return false;

  const normalizedTitle = normalizeLeadText(title);
  const normalizedVenue = normalizeLeadText(venue);
  if (!normalizedVenue) return false;
  if (normalizedTitle === normalizedVenue) return false;
  if (normalizedTitle.includes(normalizedVenue) || normalizedVenue.includes(normalizedTitle)) {
    return false;
  }
  return true;
};
