import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { formatExploreEventDateLabel, isGeographyMapSource } from '@uaetrail/shared-types';
import {
  formatListFeedPosterTitleLines,
  type BrowsePosterScheduleGrid,
  type ListFeedPosterTitleLines,
} from '../listPosterPresentation';
import {
  browseCatalogEntityName,
  browseCatalogHeaderLocationLine,
  browseCatalogHubLabel,
  browseCatalogRegionLabel,
} from './browseCatalogLabels';
import { resolveVenueBrowseCardFactLabels, resolveVenueCatalogFactLabels } from './venueBrowseFacts';
import { resolveDiscoveryBrowseGeoHubPath } from '../../discovery/browse/resolveDiscoveryBrowseGeoLink';

const emptySchedule: BrowsePosterScheduleGrid = {
  dateLabel: null,
  timeLabel: null,
  spotsLabel: null,
  priceLabel: null,
};

export type VenueBrowsePosterCopy = {
  placeLine: string | null;
  heroTitle: string;
  titleLines: ListFeedPosterTitleLines;
  schedule: BrowsePosterScheduleGrid;
  requirementLabels: string[];
};

/** Full-width poster / legacy feed title layout — browse thumbs use `resolveVenueBrowseCardCopy`. */
export const resolveVenueBrowsePosterFactLabels = (card: DiscoveryCardModel): string[] =>
  resolveVenueCatalogFactLabels(card, { includeLocationSubtitle: true });

export const resolveVenueBrowsePosterCopy = (card: DiscoveryCardModel): VenueBrowsePosterCopy => {
  const heroTitle = browseCatalogEntityName(card);
  const region = card.venueRegion?.trim() || card.subtitle?.trim() || null;

  return {
    placeLine: region,
    heroTitle,
    titleLines: formatListFeedPosterTitleLines(heroTitle, 6, 3),
    schedule: emptySchedule,
    requirementLabels: resolveVenueBrowsePosterFactLabels(card),
  };
};

export type VenueBrowseCardRating = {
  average: number;
  count: number;
};

export const resolveVenueBrowseCardRating = (
  card: DiscoveryCardModel
): VenueBrowseCardRating | null => {
  const count = card.reviewCount ?? 0;
  const average = card.averageRating;
  if (count <= 0 || average == null || !Number.isFinite(average)) return null;
  return { average, count };
};

const OUTING_HINT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Overlay date — weekday when close, `28 Nov` when further out (no year). */
const compactOutingWhenLabel = (iso: string | null | undefined, now: Date): string | null => {
  const label = formatExploreEventDateLabel(iso, now);
  if (!label) return null;
  const parts = label.split(/\s+/);
  if (parts.length >= 3) return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
  if (iso?.trim() && /^\d{4}-\d{2}-\d{2}/.test(iso)) {
    const target = new Date(`${iso.trim().slice(0, 10)}T12:00:00`);
    if (!Number.isNaN(target.getTime())) {
      const day = String(target.getDate());
      const month = OUTING_HINT_MONTHS[target.getMonth()] ?? '';
      if (month) return `${day} ${month}`;
    }
  }
  return label;
};

/** Compact “people are going here” line — omitted when the place has no hosted trips. */
export const resolveVenueBrowseScheduleHint = (
  card: DiscoveryCardModel,
  now: Date = new Date()
): string | null => {
  const count = card.venueUpcomingOutingCount ?? 0;
  if (count <= 0) return null;
  const when = compactOutingWhenLabel(card.venueNextOutingIso, now);
  if (count === 1) return when ? `1 trip · ${when}` : '1 trip scheduled';
  return when ? `${count} trips · next ${when}` : `${count} trips scheduled`;
};

export const VENUE_BROWSE_VISIBLE_FACT_LIMIT = 3;

export type VenueBrowseCardCopy = {
  title: string;
  metaLine: string | null;
  metaHref: string | null;
  regionLabel: string | null;
  hubLabel: string | null;
  locationLine: string | null;
  rating: VenueBrowseCardRating | null;
  scheduleHint: string | null;
  schedulePath: string | null;
  scheduleExploreItemId: string | null;
  factLabels: string[];
  visibleFactLabels: string[];
  hasDirections: boolean;
  canWishlist: boolean;
};

/** Venues browse bucket — location meta under title; facts + CTAs in the body. */
export const resolveVenueBrowseCardCopy = (
  card: DiscoveryCardModel,
  now: Date = new Date()
): VenueBrowseCardCopy => {
  const regionLabel = browseCatalogRegionLabel(card);
  const hubLabel = browseCatalogHubLabel(card);
  const locationLine = browseCatalogHeaderLocationLine(card);
  const metaLine =
    regionLabel && hubLabel ? `${regionLabel} · ${hubLabel}` : locationLine?.trim() || null;
  const factLabels = resolveVenueBrowseCardFactLabels(card);

  return {
  title: browseCatalogEntityName(card),
  metaLine,
  metaHref: metaLine ? resolveDiscoveryBrowseGeoHubPath(card) : null,
  regionLabel,
  hubLabel,
  locationLine,
  rating: resolveVenueBrowseCardRating(card),
  scheduleHint: resolveVenueBrowseScheduleHint(card, now),
  schedulePath: card.venueNextOutingPath?.trim() || null,
  scheduleExploreItemId: card.venueNextOutingExploreItemId?.trim() || null,
  factLabels,
  visibleFactLabels: factLabels.slice(0, VENUE_BROWSE_VISIBLE_FACT_LIMIT),
  hasDirections:
    card.mapLatitude != null &&
    card.mapLongitude != null &&
    Number.isFinite(card.mapLatitude) &&
    Number.isFinite(card.mapLongitude),
  canWishlist: isGeographyMapSource(card.source) && Boolean(card.locationId),
  };
};