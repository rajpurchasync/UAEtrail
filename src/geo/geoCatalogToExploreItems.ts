import type { ExploreMapItemDTO, ExploreMapKind } from '@uaetrail/shared-types';
import { activityDetailPath, placeDetailPath } from '@uaetrail/shared-types';
import type { GeoCatalogActivity, GeoCatalogPlace } from './geoHeroPhotos';

const catalogId = (row: { _id?: string; id?: string }): string => String(row.id ?? row._id ?? '');

const toExploreKind = (raw?: string): ExploreMapKind => {
  const kind = (raw ?? '').toLowerCase();
  if (kind === 'camping') return 'camping';
  if (kind === 'event' || kind === 'community_activity') return 'event';
  if (kind === 'rideshare') return 'rideshare';
  if (kind === 'shop') return 'shop';
  if (kind === 'agency') return 'agency';
  return 'hiking';
};

const finiteCoord = (lat?: number, lng?: number): { lat: number; lng: number } | null => {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  return Number.isFinite(parsedLat) && Number.isFinite(parsedLng)
    ? { lat: parsedLat, lng: parsedLng }
    : null;
};

const splitStartAt = (iso?: string): { date: string | null; time: string | null } => {
  if (!iso) return { date: null, time: null };
  const stamp = new Date(iso);
  if (Number.isNaN(stamp.getTime())) return { date: null, time: null };
  const date = stamp.toISOString().slice(0, 10);
  const hours = String(stamp.getHours()).padStart(2, '0');
  const minutes = String(stamp.getMinutes()).padStart(2, '0');
  return { date, time: `${hours}:${minutes}` };
};

export const geoPlaceToExploreItem = (place: GeoCatalogPlace): ExploreMapItemDTO | null => {
  const id = catalogId(place);
  if (!id) return null;
  const point = finiteCoord(place.latitude, place.longitude);
  const kind = toExploreKind(place.activityType);
  return {
    id: `venue:${id}`,
    kind,
    source: 'venue',
    title: place.name?.trim() || 'Place',
    latitude: point?.lat ?? null,
    longitude: point?.lng ?? null,
    path: placeDetailPath(place.activityType ?? 'hiking', id),
    image: place.images?.[0] ?? null,
    placeKind: kind === 'camping' || kind === 'event' || kind === 'shop' ? kind : 'hiking',
    geoRef: place.geoRef ?? null,
  };
};

export const geoActivityToExploreItem = (row: GeoCatalogActivity): ExploreMapItemDTO | null => {
  const id = catalogId(row);
  if (!id) return null;
  const point = finiteCoord(row.meetingLat, row.meetingLng) ?? finiteCoord(row.startLat, row.startLng);
  const when = splitStartAt(row.startAt);
  return {
    id: `activity:${id}`,
    kind: toExploreKind(row.activityType),
    source: 'activity',
    title: row.title?.trim() || 'Outing',
    latitude: point?.lat ?? null,
    longitude: point?.lng ?? null,
    path: activityDetailPath(id),
    date: when.date,
    time: when.time,
    image: row.images?.[0] ?? row.bannerUrl ?? null,
    activityMode: 'hosted',
    catalogPostedAt: row.startAt ?? null,
    geoRef: row.geoRef ?? null,
  };
};

export const geoPlacesToExploreItems = (places: GeoCatalogPlace[]): ExploreMapItemDTO[] =>
  places.map(geoPlaceToExploreItem).filter((item): item is ExploreMapItemDTO => item != null);

export const geoActivitiesToExploreItems = (rows: GeoCatalogActivity[]): ExploreMapItemDTO[] =>
  rows.map(geoActivityToExploreItem).filter((item): item is ExploreMapItemDTO => item != null);
