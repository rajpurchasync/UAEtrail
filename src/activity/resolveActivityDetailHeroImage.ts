import type { ActivityDetailDTO } from '@uaetrail/shared-types';

const HERO_FALLBACK_BY_TYPE: Record<string, string> = {
  camping: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600',
  event: 'https://images.unsplash.com/photo-1452626038306-9fff603b72e5?w=1600',
};

const DEFAULT_HERO_FALLBACK =
  'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600';

export const activityDetailHeroFallbackUrl = (activityType: string): string =>
  HERO_FALLBACK_BY_TYPE[activityType] ?? DEFAULT_HERO_FALLBACK;

const isUsableHeroUrl = (value: string | null | undefined): value is string => {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  if (trimmed === 'null' || trimmed === 'undefined') return false;
  return true;
};

/** Primary hero URL + typed fallback when the primary fails to load or is missing. */
export const resolveActivityDetailHeroImage = (
  activity: ActivityDetailDTO
): { src: string; fallback: string } => {
  const fallback = activityDetailHeroFallbackUrl(activity.activityType);
  const candidates = [...(activity.images ?? []), ...(activity.location?.images ?? [])];
  const primary = candidates.find(isUsableHeroUrl);
  return { src: primary ?? fallback, fallback };
};
