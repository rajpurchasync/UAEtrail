import type {
  DiscoveryCardKind,
  DiscoveryCardSource,
  ExploreMapItemDTO,
  PlaceKind,
} from '@uaetrail/shared-types';
import { PLACE_KIND_LABELS } from '@uaetrail/shared-types';
import { exploreCatalogHubLabelFromExploreItem } from './exploreCatalogHubLabel';
import { resolveExploreCoverImage } from './exploreCoverImage';
import { formatExploreMapPinDateShort, isScheduledActivityMapPin } from './exploreMapPinTooltip';

const MAP_PIN_KIND_LABEL: Partial<Record<DiscoveryCardKind, string>> = {
  hiking: 'Hiking',
  camping: 'Camping',
  rideshare: 'Rideshare',
  event: 'Event',
  activity: 'Outing',
  shop: 'Shop',
};

/** Type · date labels — from explore default zoom (Booking price-pill equivalent). */
export const MAP_PIN_ACTIVITY_CAPTION_MIN_ZOOM_MAP = 9;
export const MAP_PIN_ACTIVITY_CAPTION_MIN_ZOOM_SATELLITE = 9;

/** Date line on trip captions — matches primary caption zoom. */
export const MAP_PIN_ACTIVITY_WHERE_MIN_ZOOM_MAP = 9;
export const MAP_PIN_ACTIVITY_WHERE_MIN_ZOOM_SATELLITE = 9;

/** @deprecated use style-specific mins in resolveMapPinActivityCaption */
export const MAP_PIN_ACTIVITY_CAPTION_MIN_ZOOM = MAP_PIN_ACTIVITY_CAPTION_MIN_ZOOM_MAP;

/** Show “Trip” text on venue chips (dot always when count &gt; 0). */
export const MAP_PIN_VENUE_TRIP_LABEL_MIN_ZOOM = 11;

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Fixed crew availability pins on the Trips map (`source: availability`). */
export const MAP_PIN_LOOKING_CAPTION = 'Looking for';

/** @deprecated Use {@link MAP_PIN_LOOKING_CAPTION} — not legacy participant-intent seeking. */
export const MAP_PIN_SEEKING_CAPTION = MAP_PIN_LOOKING_CAPTION;

const isMapAvailabilityCaptionSource = (source?: DiscoveryCardSource): boolean => source === 'availability';

const MAP_PIN_HUB_MAX_LEN = 24;

const truncateMapPinHub = (label: string): string => {
  const trimmed = label.trim();
  if (trimmed.length <= MAP_PIN_HUB_MAX_LEN) return trimmed;
  return `${trimmed.slice(0, MAP_PIN_HUB_MAX_LEN - 1)}…`;
};

/** Venue name on trip pins — at most two words so captions stay readable on mobile. */
export const truncateMapPinVenueTwoWords = (label: string): string => {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  return words.slice(0, 2).join(' ');
};

const OUTING_PLACE_KIND_LABEL: Partial<Record<DiscoveryCardKind, string>> = {
  hiking: 'Trail',
  camping: 'Camp',
  event: 'Event venue',
};

export const resolveMapPinPlaceKindLabel = (
  kind: DiscoveryCardKind,
  placeKind?: PlaceKind | null,
  source?: DiscoveryCardSource
): string => {
  if (source === 'facility' && placeKind && placeKind in PLACE_KIND_LABELS) {
    return PLACE_KIND_LABELS[placeKind];
  }
  const outing = OUTING_PLACE_KIND_LABEL[kind];
  if (outing) return outing;
  if (placeKind && placeKind in PLACE_KIND_LABELS) return PLACE_KIND_LABELS[placeKind];
  return 'Place';
};

/** Spot / trail name for hosted trip captions — not the area hub label. */
export const resolveExploreMapPinVenueName = (item: ExploreMapItemDTO): string | null => {
  const activityLoc = item.activity?.locationName?.trim();
  if (activityLoc) return activityLoc;
  const geoVenue = item.geoRef?.names?.venue?.trim();
  if (geoVenue) return geoVenue;
  const cardName = (item.locationCard as { name?: string } | null | undefined)?.name?.trim();
  if (cardName) return cardName;
  const hub = exploreCatalogHubLabelFromExploreItem(item);
  return hub ? truncateMapPinHub(hub) : null;
};

export const resolveExploreMapPinCoverImage = (item: ExploreMapItemDTO): string | null =>
  resolveExploreCoverImage(item.image, item.locationCard?.images?.[0], item.locationCard?.images?.[1]);

/** Curated area / place hub for map pin “where” line (Hatta, Shawka, …) — not trail or spot title. */
export const resolveExploreMapPinPlaceHub = (item: ExploreMapItemDTO): string | null => {
  const hub = exploreCatalogHubLabelFromExploreItem(item);
  return hub ? truncateMapPinHub(hub) : null;
};

export const resolveMapPinActivityKindLabel = (
  kind: DiscoveryCardKind,
  activityMode?: 'hosted' | 'seeking' | null
): string | null => {
  if (activityMode === 'seeking') return null;
  return MAP_PIN_KIND_LABEL[kind] ?? 'Trip';
};

const noonLocal = (isoDate: string): Date => new Date(`${isoDate.slice(0, 10)}T12:00:00`);

/** Relative outing day for map pin captions — null when unscheduled or in the past. */
export const formatMapPinRelativeDate = (
  iso?: string | null,
  now: Date = new Date()
): string | null => {
  if (!iso?.trim()) return null;
  const target = noonLocal(iso.trim());
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date(now);
  today.setHours(12, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return null;

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) {
    return WEEKDAY_SHORT[target.getDay()] ?? null;
  }

  return formatExploreMapPinDateShort(iso);
};

export type MapPinActivityCaption = {
  /** What + when — e.g. `Hiking · Tomorrow` or `Looking for`. */
  primary: string;
  /** Reserved — trip pins use a single caption line (type · date). */
  where: string | null;
};

export const resolveMapPinPlaceCaption = (options: {
  kind: DiscoveryCardKind;
  placeKind?: PlaceKind | null;
  source?: DiscoveryCardSource;
  venueName: string;
  mapZoom: number;
  mapStyle?: 'satellite' | 'map';
  selected?: boolean;
}): MapPinActivityCaption | null => {
  const minZoom =
    options.mapStyle === 'satellite'
      ? MAP_PIN_ACTIVITY_CAPTION_MIN_ZOOM_SATELLITE
      : MAP_PIN_ACTIVITY_CAPTION_MIN_ZOOM_MAP;
  if (options.mapZoom < minZoom && !options.selected) return null;

  const kindLabel = resolveMapPinPlaceKindLabel(options.kind, options.placeKind, options.source);
  const venueShort = truncateMapPinVenueTwoWords(options.venueName);
  if (!kindLabel && !venueShort) return null;
  return {
    primary: kindLabel || 'Place',
    where: venueShort || null,
  };
};

export const resolveMapPinActivityCaption = (options: {
  kind: DiscoveryCardKind;
  scheduleDate?: string | null;
  activityMode?: 'hosted' | 'seeking' | null;
  source?: DiscoveryCardSource;
  mapZoom: number;
  mapStyle?: 'satellite' | 'map';
  selected?: boolean;
  now?: Date;
}): MapPinActivityCaption | null => {
  const minZoom =
    options.mapStyle === 'satellite'
      ? MAP_PIN_ACTIVITY_CAPTION_MIN_ZOOM_SATELLITE
      : MAP_PIN_ACTIVITY_CAPTION_MIN_ZOOM_MAP;
  if (options.mapZoom < minZoom && !options.selected) return null;

  if (isMapAvailabilityCaptionSource(options.source)) {
    const kindLabel = MAP_PIN_KIND_LABEL[options.kind] ?? 'Outing';
    const dateLabel = formatMapPinRelativeDate(options.scheduleDate, options.now);
    return {
      primary: MAP_PIN_LOOKING_CAPTION,
      where: dateLabel ?? kindLabel,
    };
  }

  if (!isScheduledActivityMapPin({ source: options.source, activityMode: options.activityMode })) {
    return null;
  }

  const kindLabel = resolveMapPinActivityKindLabel(options.kind, options.activityMode);
  const dateLabel = formatMapPinRelativeDate(options.scheduleDate, options.now);

  if (!kindLabel && !dateLabel) return null;

  return {
    primary: kindLabel ?? 'Trip',
    where: dateLabel,
  };
};

export const resolveMapPinVenueTripLabel = (
  hostedTripCount: number,
  mapZoom: number
): string | null => {
  if (hostedTripCount <= 0) return null;
  if (mapZoom < MAP_PIN_VENUE_TRIP_LABEL_MIN_ZOOM) return null;
  return hostedTripCount === 1 ? 'Trip' : `${hostedTripCount} trips`;
};