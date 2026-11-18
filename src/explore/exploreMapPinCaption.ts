import type { DiscoveryCardKind, DiscoveryCardSource, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { browseCatalogHubLabelFromExploreItem } from '../list/browse/browseCatalogLabels';
import { formatExploreMapPinDateShort, isScheduledActivityMapPin } from './exploreMapPinTooltip';

const MAP_PIN_KIND_LABEL: Partial<Record<DiscoveryCardKind, string>> = {
  hiking: 'Hiking',
  camping: 'Camping',
  rideshare: 'Rideshare',
  event: 'Event',
  activity: 'Outing',
  shop: 'Shop',
};

/** Show activity what/when/where chips from explore default zoom (9) and in. */
export const MAP_PIN_ACTIVITY_CAPTION_MIN_ZOOM = 9;

/** Show “Trip” text on venue chips (dot always when count &gt; 0). */
export const MAP_PIN_VENUE_TRIP_LABEL_MIN_ZOOM = 11;

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const MAP_PIN_SEEKING_CAPTION = 'Looking for';

const MAP_PIN_HUB_MAX_LEN = 24;

const truncateMapPinHub = (label: string): string => {
  const trimmed = label.trim();
  if (trimmed.length <= MAP_PIN_HUB_MAX_LEN) return trimmed;
  return `${trimmed.slice(0, MAP_PIN_HUB_MAX_LEN - 1)}…`;
};

/** Curated area / place hub for map pin “where” line (Hatta, Shawka, …) — not trail or spot title. */
export const resolveExploreMapPinPlaceHub = (item: ExploreMapItemDTO): string | null => {
  const hub = browseCatalogHubLabelFromExploreItem(item);
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
  /** Where — area / place hub name. */
  where: string | null;
};

export const resolveMapPinActivityCaption = (options: {
  kind: DiscoveryCardKind;
  placeHub?: string | null;
  scheduleDate?: string | null;
  activityMode?: 'hosted' | 'seeking' | null;
  source?: DiscoveryCardSource;
  mapZoom: number;
  now?: Date;
}): MapPinActivityCaption | null => {
  if (options.mapZoom < MAP_PIN_ACTIVITY_CAPTION_MIN_ZOOM) return null;

  const where = options.placeHub?.trim() || null;

  if (options.activityMode === 'seeking') {
    return { primary: MAP_PIN_SEEKING_CAPTION, where };
  }

  if (!isScheduledActivityMapPin({ source: options.source, activityMode: options.activityMode })) {
    return null;
  }

  const kindLabel = resolveMapPinActivityKindLabel(options.kind, options.activityMode);
  const dateLabel = formatMapPinRelativeDate(options.scheduleDate, options.now);

  const primaryParts = [kindLabel, dateLabel].filter((part): part is string => Boolean(part));
  if (primaryParts.length === 0 && !where) return null;

  const primary = primaryParts.length > 0 ? primaryParts.join(' · ') : (kindLabel ?? 'Trip');

  return { primary, where };
};

export const resolveMapPinVenueTripLabel = (
  hostedTripCount: number,
  mapZoom: number
): string | null => {
  if (hostedTripCount <= 0) return null;
  if (mapZoom < MAP_PIN_VENUE_TRIP_LABEL_MIN_ZOOM) return null;
  return hostedTripCount === 1 ? 'Trip' : `${hostedTripCount} trips`;
};