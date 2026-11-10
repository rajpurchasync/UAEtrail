import { activityDetailPath, placeDetailPath, type GeoRef } from '@uaetrail/shared-types';
import {
  collectDetailHeroPhotos,
  pickRandomHeroPhotos,
  type DetailHeroPhoto,
} from '../detail/shared/detailHeroPhotos';

export type GeoCatalogPlace = {
  _id?: string;
  id?: string;
  name?: string;
  activityType?: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
  geoRef?: GeoRef | null;
};

export type GeoCatalogActivity = {
  _id?: string;
  id?: string;
  title?: string;
  activityType?: string;
  images?: string[];
  bannerUrl?: string | null;
  startAt?: string;
  meetingLat?: number;
  meetingLng?: number;
  startLat?: number;
  startLng?: number;
  geoRef?: GeoRef | null;
};

const catalogId = (row: { _id?: string; id?: string }): string => String(row.id ?? row._id ?? '');

const placeKindLabel = (activityType?: string): string => {
  const kind = activityType?.toLowerCase() ?? '';
  if (kind === 'event' || kind === 'community_activity') return 'Spot';
  if (kind === 'camping') return 'Camp';
  if (kind === 'hiking') return 'Trail';
  return 'Place';
};

export const geoHeroPhotosFromCatalog = (
  places: GeoCatalogPlace[],
  activities: GeoCatalogActivity[]
): DetailHeroPhoto[] =>
  pickRandomHeroPhotos(
    collectDetailHeroPhotos([
      ...places.map((place) => {
        const id = catalogId(place);
        return {
          srcs: place.images ?? [],
          title: place.name?.trim() || 'Place',
          kindLabel: placeKindLabel(place.activityType),
          href: placeDetailPath(place.activityType ?? 'hiking', id),
        };
      }),
      ...activities.map((activity) => {
        const id = catalogId(activity);
        return {
          srcs: [...(activity.images ?? []), activity.bannerUrl],
          title: activity.title?.trim() || 'Outing',
          kindLabel: 'Outing',
          href: activityDetailPath(id),
        };
      }),
    ])
  );
