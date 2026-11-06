/** Primary cover image for activity crew chat avatar (first uploaded art). */
export const resolveActivityPrimaryImageUrl = (doc: {
  images?: string[] | null;
  bannerUrl?: string | null;
  location?: { images?: string[] | null } | null;
}): string | null => {
  const fromActivity = doc.images?.find((url) => typeof url === 'string' && url.trim().length > 0)?.trim();
  if (fromActivity) return fromActivity;
  const fromLocation = doc.location?.images
    ?.find((url) => typeof url === 'string' && url.trim().length > 0)
    ?.trim();
  if (fromLocation) return fromLocation;
  const banner = doc.bannerUrl?.trim();
  return banner || null;
};
