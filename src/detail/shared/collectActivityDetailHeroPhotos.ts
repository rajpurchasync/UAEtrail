import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { activityDetailPath } from '@uaetrail/shared-types';
import { activityKindChromeLabel } from '../../activity/activityKindChrome';
import { resolveActivityDetailHeroImage } from '../../activity/resolveActivityDetailHeroImage';
import { activityRegistryPlacePath } from '../../utils/activityRegistryPlacePath';
import { collectDetailHeroPhotos, type DetailHeroPhoto } from './detailHeroPhotos';

const placeKindLabel = (activityType: string | null | undefined): string => {
  if (activityType === 'camping') return 'Camp spot';
  if (activityType === 'hiking') return 'Trail';
  return 'Place';
};

/** Activity hero pool: outing photos, then linked venue/trail images (plan §3.1). */
export const collectActivityDetailHeroPhotos = (activity: ActivityDetailDTO): DetailHeroPhoto[] => {
  const typeLabel = activityKindChromeLabel(activity.activityType);
  const outingTitle =
    activity.title?.trim() || activity.locationName?.trim() || 'Outing';
  const sources: Array<{
    srcs: Array<string | null | undefined>;
    title: string;
    kindLabel: string;
    href: string;
  }> = [
    {
      srcs: activity.images ?? [],
      title: outingTitle,
      kindLabel: typeLabel,
      href: activityDetailPath(activity.id),
    },
  ];

  const placeHref = activityRegistryPlacePath(activity);
  const placeName = activity.location?.name?.trim() || activity.locationName?.trim() || '';
  if (placeHref && placeName) {
    sources.push({
      srcs: activity.location?.images ?? [],
      title: placeName,
      kindLabel: placeKindLabel(activity.location?.activityType),
      href: placeHref,
    });
  }

  const photos = collectDetailHeroPhotos(sources);
  if (photos.length > 0) return photos;

  const { src } = resolveActivityDetailHeroImage(activity);
  return [
    {
      src,
      title: outingTitle,
      kindLabel: typeLabel,
      href: activityDetailPath(activity.id),
    },
  ];
};
