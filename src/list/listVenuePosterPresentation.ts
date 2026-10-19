import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { isGeographyMapSource } from '@uaetrail/shared-types';
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

/** Area + location under place name in catalog header (not venue kind). */
export const resolveCatalogHeaderAreaLocationLine = (card: DiscoveryCardModel): string | null => {
  const nameNorm = normalize(resolveCatalogEntityName(card));
  const region = card.venueRegion?.trim() || null;
  const subtitle = card.subtitle?.trim() || null;

  const regionPart =
    region && normalize(region) !== nameNorm ? region : null;
  const locationPart =
    subtitle && normalize(subtitle) !== nameNorm ? subtitle : null;

  if (
    regionPart &&
    locationPart &&
    normalize(regionPart) !== normalize(locationPart)
  ) {
    return `${regionPart} · ${locationPart}`;
  }
  return locationPart || regionPart || null;
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
  if (card.venueHasParking) return 'Parking';
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

/** Catalog attribute pills — aligned with place detail stats (optional local subtitle for list posters). */
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

  if (card.childFriendly) labels.push('Child-friendly');

  const parking = resolveParkingLabel(card);
  if (parking) labels.push(parking);

  if (card.kind === 'hiking') {
    const difficulty = resolveDifficultyLabel(card);
    if (difficulty) labels.push(difficulty);
    const distance = resolveDistanceLabel(card);
    if (distance) labels.push(distance);
    const elevation = resolveElevationLabel(card);
    if (elevation) labels.push(elevation);
    const duration = resolveDurationLabel(card);
    if (duration) labels.push(duration);
  }

  if (card.kind === 'camping') {
    const campingType = resolveCampingTypeLabel(card);
    if (campingType) labels.push(campingType);
    const surfaces = resolveSurfaceLabels(card);
    if (surfaces.length) labels.push(...surfaces);
    const group = resolveMaxGroupLabel(card);
    if (group) labels.push(group);
  }

  const reach = resolveReachabilityLabel(card);
  if (reach) labels.push(reach);

  return [...new Set(labels)].slice(0, 8);
};

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

