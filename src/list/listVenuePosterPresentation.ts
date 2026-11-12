import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { formatExploreEventDateLabel, isGeographyMapSource } from '@uaetrail/shared-types';
import {
  formatListFeedPosterTitleLines,
  type BrowsePosterScheduleGrid,
  type ListFeedPosterTitleLines,
} from './listPosterPresentation';

const capitalize = (value: string): string =>
  value.length ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const emptySchedule: BrowsePosterScheduleGrid = {
  dateLabel: null,
  timeLabel: null,
  spotsLabel: null,
  priceLabel: null,
};

const normalize = (value: string | null | undefined): string =>
  value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';

export const resolveCatalogEntityName = (card: DiscoveryCardModel): string => {
  const listTitle = card.listTitle?.trim();
  if (listTitle) return listTitle;
  const headline = card.headline?.trim();
  if (headline) return headline.split(' - ')[0]?.trim() || headline;
  return 'Outdoor place';
};

const stripTrailingRegion = (value: string, region: string | null): string => {
  if (!region) return value;
  const suffix = ` · ${region}`;
  if (value.endsWith(suffix)) return value.slice(0, -suffix.length).trim();
  if (normalize(value) === normalize(region)) return '';
  return value;
};

/** Emirate / state — never the place title. */
export const resolveCatalogRegionLabel = (card: DiscoveryCardModel): string | null => {
  const nameNorm = normalize(resolveCatalogEntityName(card));
  const region = card.venueRegion?.trim() || null;
  return region && normalize(region) !== nameNorm ? region : null;
};

/** Place hub (Hatta, Wadi Shawka) — never the title or the emirate again. */
export const resolveCatalogHubLabel = (card: DiscoveryCardModel): string | null => {
  const nameNorm = normalize(resolveCatalogEntityName(card));
  const regionPart = resolveCatalogRegionLabel(card);
  const hubFromArea =
    card.areaName?.trim() && normalize(card.areaName) !== nameNorm ? card.areaName.trim() : null;
  const hubFromSubtitle = card.subtitle?.trim()
    ? stripTrailingRegion(card.subtitle.trim(), regionPart)
    : '';
  const subtitlePart =
    hubFromSubtitle && normalize(hubFromSubtitle) !== nameNorm ? hubFromSubtitle : null;
  const locationPart = hubFromArea || subtitlePart || null;
  if (locationPart && regionPart && normalize(locationPart) === normalize(regionPart)) return null;
  return locationPart;
};

/** Emirate · place hub — never “Hiking trail location”. */
export const resolveCatalogHeaderAreaLocationLine = (card: DiscoveryCardModel): string | null => {
  const regionPart = resolveCatalogRegionLabel(card);
  const hubPart = resolveCatalogHubLabel(card);
  if (regionPart && hubPart) return `${regionPart} · ${hubPart}`;
  return hubPart || regionPart || null;
};

/** Trail / wadi line under emirate — subtitle when it differs from region eyebrow. */
const resolveVenueLocationFact = (card: DiscoveryCardModel): string | null => {
  const subtitle = card.subtitle?.trim();
  if (!subtitle) return null;
  const region = card.venueRegion?.trim();
  if (region && normalize(subtitle) === normalize(region)) return null;
  if (normalize(subtitle) === normalize(resolveCatalogEntityName(card))) return null;
  return subtitle;
};

const resolveReachabilityLabel = (card: DiscoveryCardModel): string | null => {
  const accessibility = card.venueAccessibility;
  if (accessibility === 'remote') return '4x4 required';
  if (accessibility === 'car-accessible') return 'Sedan access';
  return null;
};

const resolveParkingLabel = (card: DiscoveryCardModel): string | null => {
  if (card.venueHasParking) return 'Parking available';
  if (card.venueAccessibility === 'car-accessible') return 'Parking access';
  return null;
};

const resolveDifficultyLabel = (card: DiscoveryCardModel): string | null => {
  const difficulty = card.difficulty;
  if (!difficulty) return null;
  if (difficulty === 'moderate') return 'Moderate';
  return capitalize(difficulty);
};

const resolveSurfaceLabels = (card: DiscoveryCardModel): string[] => {
  const surfaces = card.surfaceTypes ?? [];
  return surfaces
    .map((s) => capitalize(s.replace(/_/g, ' ')))
    .filter(Boolean)
    .slice(0, 2);
};

const resolveDistanceLabel = (card: DiscoveryCardModel): string | null => {
  const km = card.venueDistanceKm;
  if (km == null || !Number.isFinite(km) || km <= 0) return null;
  const rounded = km % 1 === 0 ? String(km) : km.toFixed(1);
  return `${rounded} km`;
};

const resolveElevationLabel = (card: DiscoveryCardModel): string | null => {
  const meters = card.venueElevationM;
  if (meters == null || !Number.isFinite(meters) || meters <= 0) return null;
  const rounded = meters % 1 === 0 ? String(meters) : meters.toFixed(0);
  return `${rounded} m elevation`;
};

const resolveDurationLabel = (card: DiscoveryCardModel): string | null => {
  const hours = card.venueDurationHours;
  if (hours == null || !Number.isFinite(hours) || hours <= 0) return null;
  const rounded = hours % 1 === 0 ? String(hours) : hours.toFixed(1);
  return `${rounded} hr${hours === 1 ? '' : 's'}`;
};

const resolveCampingTypeLabel = (card: DiscoveryCardModel): string | null => {
  if (card.kind !== 'camping') return null;
  if (card.venueCampingType === 'self-guided') return 'Self-guided camping';
  if (card.venueCampingType === 'operator-led') return 'Operator-led camping';
  return null;
};

const resolveMaxGroupLabel = (card: DiscoveryCardModel): string | null => {
  const size = card.venueMaxGroupSize;
  if (size == null || !Number.isFinite(size) || size <= 0) return null;
  return `Up to ${size} people`;
};

/** Parking, child-friendly, on-site facilities — shared by hiking and camping cards. */
export const resolveSharedPlaceFactLabels = (card: DiscoveryCardModel): string[] => {
  const labels: string[] = [];
  if (card.childFriendly) labels.push('Child-friendly');
  const parking = resolveParkingLabel(card);
  if (parking) labels.push(parking);
  for (const amenity of card.venueAmenityLabels ?? []) {
    const chip = amenity.trim();
    if (!chip) continue;
    if (chip === 'Parking' && labels.includes('Parking available')) continue;
    labels.push(chip);
  }
  return labels;
};

/** Trail registry facts — length/elevation live here, not on camp cards. */
export const resolveHikingPlaceFactLabels = (card: DiscoveryCardModel): string[] => {
  if (card.kind !== 'hiking') return [];
  const labels: string[] = [];
  const difficulty = resolveDifficultyLabel(card);
  if (difficulty) labels.push(difficulty);
  const distance = resolveDistanceLabel(card);
  if (distance) labels.push(distance);
  const elevation = resolveElevationLabel(card);
  if (elevation) labels.push(elevation);
  const duration = resolveDurationLabel(card);
  if (duration) labels.push(duration);
  return labels;
};

/** Camp registry facts — surface / camping style, never trail kilometres. */
export const resolveCampingPlaceFactLabels = (card: DiscoveryCardModel): string[] => {
  if (card.kind !== 'camping') return [];
  const labels: string[] = [];
  const campingType = resolveCampingTypeLabel(card);
  if (campingType) labels.push(campingType);
  labels.push(...resolveSurfaceLabels(card));
  const group = resolveMaxGroupLabel(card);
  if (group) labels.push(group);
  return labels;
};

/** Catalog attribute pills — hiking and camping share chrome, not fact packs. */
export const resolvePlaceCatalogFactLabels = (
  card: DiscoveryCardModel,
  options?: { includeLocationSubtitle?: boolean }
): string[] => {
  if (card.source === 'shop') return resolveShopPosterFactLabels(card);
  if (!isGeographyMapSource(card.source)) return [];

  const labels: string[] = [];

  if (options?.includeLocationSubtitle) {
    const location = resolveVenueLocationFact(card);
    if (location) labels.push(location);
  }

  labels.push(...resolveSharedPlaceFactLabels(card));

  if (card.kind === 'hiking') labels.push(...resolveHikingPlaceFactLabels(card));
  if (card.kind === 'camping') labels.push(...resolveCampingPlaceFactLabels(card));

  const reach = resolveReachabilityLabel(card);
  if (reach) labels.push(reach);

  return [...new Set(labels)].slice(0, 8);
};

/** Thumbnail chips — hub/emirate live in the listing identity, not as pills. */
export const resolveListVenueThumbnailFactLabels = (card: DiscoveryCardModel): string[] =>
  resolvePlaceCatalogFactLabels(card);

const LIST_VENUE_LISTING_FACT_LIMIT = 5;

/** Listing chips — kind first (trail vs camp), then amenities, capped for scan. */
export const resolveListVenueListingFactLabels = (card: DiscoveryCardModel): string[] => {
  if (card.source === 'shop') return ['Outdoor shop'];
  const kindFacts =
    card.kind === 'hiking'
      ? resolveHikingPlaceFactLabels(card).slice(0, 2)
      : card.kind === 'camping'
        ? resolveCampingPlaceFactLabels(card).slice(0, 2)
        : [];
  const shared = resolveSharedPlaceFactLabels(card);
  const reach = resolveReachabilityLabel(card);
  const rest = reach && !shared.includes(reach) ? [...shared, reach] : shared;
  return [...new Set([...kindFacts, ...rest])].slice(0, LIST_VENUE_LISTING_FACT_LIMIT);
};

export type ListVenueListingRating = {
  average: number;
  count: number;
};

export const resolveListVenueListingRating = (
  card: DiscoveryCardModel
): ListVenueListingRating | null => {
  const count = card.reviewCount ?? 0;
  const average = card.averageRating;
  if (count <= 0 || average == null || !Number.isFinite(average)) return null;
  return { average, count };
};

/** Overlay date — weekday when close, `28 Nov` when further out (no year). */
const compactOutingWhenLabel = (iso: string | null | undefined, now: Date): string | null => {
  const label = formatExploreEventDateLabel(iso, now);
  if (!label) return null;
  const parts = label.split(/\s+/);
  if (parts.length >= 3) return `${parts[1]} ${parts[2]}`;
  return label;
};

/** Compact “people are going here” line — omitted when the place has no hosted trips. */
export const resolveListVenueScheduleHint = (
  card: DiscoveryCardModel,
  now: Date = new Date()
): string | null => {
  const count = card.venueUpcomingOutingCount ?? 0;
  if (count <= 0) return null;
  const when = compactOutingWhenLabel(card.venueNextOutingIso, now);
  if (count === 1) return when ? `1 trip · ${when}` : '1 trip scheduled';
  return when ? `${count} trips · next ${when}` : `${count} trips scheduled`;
};

export type ListVenueListingCopy = {
  title: string;
  regionLabel: string | null;
  hubLabel: string | null;
  locationLine: string | null;
  rating: ListVenueListingRating | null;
  scheduleHint: string | null;
  schedulePath: string | null;
  scheduleExploreItemId: string | null;
  factLabels: string[];
  hasDirections: boolean;
  canWishlist: boolean;
};

/** Venue list card — where on the photo, name + rating below, then act. */
export const resolveListVenueListingCopy = (
  card: DiscoveryCardModel,
  now: Date = new Date()
): ListVenueListingCopy => ({
  title: resolveCatalogEntityName(card),
  regionLabel: resolveCatalogRegionLabel(card),
  hubLabel: resolveCatalogHubLabel(card),
  locationLine: resolveCatalogHeaderAreaLocationLine(card),
  rating: resolveListVenueListingRating(card),
  scheduleHint: resolveListVenueScheduleHint(card, now),
  schedulePath: card.venueNextOutingPath?.trim() || null,
  scheduleExploreItemId: card.venueNextOutingExploreItemId?.trim() || null,
  factLabels: resolveListVenueListingFactLabels(card),
  hasDirections:
    card.mapLatitude != null &&
    card.mapLongitude != null &&
    Number.isFinite(card.mapLatitude) &&
    Number.isFinite(card.mapLongitude),
  canWishlist: isGeographyMapSource(card.source) && Boolean(card.locationId),
});

const resolveShopPosterFactLabels = (card: DiscoveryCardModel): string[] => {
  const labels: string[] = [];
  const region = card.venueRegion?.trim() || card.subtitle?.trim();
  if (region && normalize(region) !== normalize(resolveCatalogEntityName(card))) {
    labels.push(region);
  }
  labels.push('Outdoor shop');
  return [...new Set(labels)].slice(0, 6);
};

/** Fact pills on place / shop posters. */
export const resolveListVenuePosterFactLabels = (card: DiscoveryCardModel): string[] =>
  resolvePlaceCatalogFactLabels(card, { includeLocationSubtitle: true });

export type ListVenuePosterCopy = {
  placeLine: string | null;
  heroTitle: string;
  titleLines: ListFeedPosterTitleLines;
  schedule: BrowsePosterScheduleGrid;
  requirementLabels: string[];
};

export const resolveListVenuePosterCopy = (card: DiscoveryCardModel): ListVenuePosterCopy => {
  const heroTitle = resolveCatalogEntityName(card);
  const region = card.venueRegion?.trim() || card.subtitle?.trim() || null;

  return {
    placeLine: region,
    heroTitle,
    titleLines: formatListFeedPosterTitleLines(heroTitle, 6, 3),
    schedule: emptySchedule,
    requirementLabels: resolveListVenuePosterFactLabels(card),
  };
};

