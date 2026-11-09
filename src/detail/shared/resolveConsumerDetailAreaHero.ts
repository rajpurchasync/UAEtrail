import type { ActivityDetailDTO } from '@uaetrail/shared-types';

export const resolveActivityDetailAreaHero = (
  activity: Pick<ActivityDetailDTO, 'region' | 'location'>
): {
  region: string;
  areaLabel: string | null;
  areaSlug: string | null;
} => {
  const loc = activity.location;
  const region = activity.region?.trim() || loc?.region?.trim() || '';
  const areaLabel = loc?.areaName?.trim() || loc?.areaLabel?.trim() || null;
  const areaSlug = loc?.areaSlug?.trim() || null;
  return { region, areaLabel, areaSlug };
};
