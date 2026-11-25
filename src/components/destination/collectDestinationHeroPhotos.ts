import { activityDetailPath, placeDetailPath, type ActivityDTO, type LocationDTO } from '@uaetrail/shared-types';
import { collectDetailHeroPhotos, type DetailHeroPhoto } from '../../detail/shared/detailHeroPhotos';
import { placeDetailRouteKindForRow, placeKindLabelForRow } from './destinationHubPlaceGroups';

export const collectDestinationHeroPhotos = ({
  places,
  activities,
  areaImageUrl,
  destinationName,
  areaHref,
}: {
  places: LocationDTO[];
  activities: ActivityDTO[];
  areaImageUrl?: string | null;
  destinationName: string;
  areaHref: string;
}): DetailHeroPhoto[] =>
  collectDetailHeroPhotos([
    ...places.map((place) => ({
      srcs: place.images ?? [],
      title: place.name,
      kindLabel: placeKindLabelForRow(place),
      href: placeDetailPath(placeDetailRouteKindForRow(place), place.id),
    })),
    ...activities.map((activity) => ({
      srcs: [...(activity.images ?? []), activity.bannerUrl],
      title: activity.title,
      kindLabel: 'Outing',
      href: activityDetailPath(activity.id),
    })),
    {
      srcs: [areaImageUrl],
      title: destinationName,
      kindLabel: 'Area',
      href: areaHref,
    },
  ]);
