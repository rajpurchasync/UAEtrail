import type { ExploreCardModel } from '../explore/exploreCardModel';
import type { BrowsePosterScheduleGrid, ListFeedPosterTitleLines } from './listPosterPresentation';

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

export const resolveCatalogEntityName = (card: ExploreCardModel): string => {
  const listTitle = card.listTitle?.trim();
  if (listTitle) return listTitle;
  const headline = card.headline?.trim();
  if (headline) return headline.split(' - ')[0]?.trim() || headline;
  return 'Outdoor place';
};

/** Trail / wadi line under emirate — subtitle when it differs from region eyebrow. */
const resolveVenueLocationFact = (card: ExploreCardModel): string | null => {
  const subtitle = card.subtitle?.trim();
  if (!subtitle) return null;
  const region = card.venueRegion?.trim();
  if (region && normalize(subtitle) === normalize(region)) return null;
  if (normalize(subtitle) === normalize(resolveCatalogEntityName(card))) return null;
  return subtitle;
};

const resolveReachabilityLabel = (card: ExploreCardModel): string | null => {
  const accessibility = card.venueAccessibility;
  if (accessibility === 'remote') return '4x4 required';
  if (accessibility === 'car-accessible') return 'Sedan access';
  return null;
};

const resolveParkingLabel = (card: ExploreCardModel): string | null => {
  if (card.venueHasParking) return 'Parking';
  if (card.venueAccessibility === 'car-accessible') return 'Parking access';
  return null;
};

const resolveDifficultyLabel = (card: ExploreCardModel): string | null => {
  const difficulty = card.difficulty;
  if (!difficulty) return null;
  if (difficulty === 'moderate') return 'Moderate';
  return capitalize(difficulty);
};

const resolveSurfaceLabels = (card: ExploreCardModel): string[] => {
  const surfaces = card.surfaceTypes ?? [];
  return surfaces
    .map((s) => capitalize(s.replace(/_/g, ' ')))
    .filter(Boolean)
    .slice(0, 2);
};

const resolveDistanceLabel = (card: ExploreCardModel): string | null => {
  const km = card.venueDistanceKm;
  if (km == null || !Number.isFinite(km) || km <= 0) return null;
  const rounded = km % 1 === 0 ? String(km) : km.toFixed(1);
  return `${rounded} km`;
};

const resolveShopPosterFactLabels = (card: ExploreCardModel): string[] => {
  const labels: string[] = [];
  const region = card.venueRegion?.trim() || card.subtitle?.trim();
  if (region && normalize(region) !== normalize(resolveCatalogEntityName(card))) {
    labels.push(region);
  }
  labels.push('Outdoor shop');
  return [...new Set(labels)].slice(0, 6);
};

/** Fact pills on place / shop posters. */
export const resolveListVenuePosterFactLabels = (card: ExploreCardModel): string[] => {
  if (card.source === 'shop') return resolveShopPosterFactLabels(card);
  if (card.source !== 'venue') return [];

  const labels: string[] = [];

  const location = resolveVenueLocationFact(card);
  if (location) labels.push(location);

  if (card.childFriendly) labels.push('Child-friendly');

  const parking = resolveParkingLabel(card);
  if (parking) labels.push(parking);

  if (card.kind === 'hiking') {
    const difficulty = resolveDifficultyLabel(card);
    if (difficulty) labels.push(difficulty);
    const distance = resolveDistanceLabel(card);
    if (distance) labels.push(distance);
  }

  if (card.kind === 'camping') {
    const surfaces = resolveSurfaceLabels(card);
    if (surfaces.length) labels.push(...surfaces);
  }

  const reach = resolveReachabilityLabel(card);
  if (reach) labels.push(reach);

  return [...new Set(labels)].slice(0, 6);
};

export type ListVenuePosterCopy = {
  placeLine: string | null;
  heroTitle: string;
  titleLines: ListFeedPosterTitleLines;
  schedule: BrowsePosterScheduleGrid;
  requirementLabels: string[];
};

export const resolveListVenuePosterCopy = (card: ExploreCardModel): ListVenuePosterCopy => {
  const heroTitle = resolveCatalogEntityName(card);
  const region = card.venueRegion?.trim() || card.subtitle?.trim() || null;
  const nameNorm = normalize(heroTitle);
  const regionNorm = region ? normalize(region) : '';
  const placeLine = region && regionNorm !== nameNorm ? region : null;

  return {
    placeLine,
    heroTitle,
    titleLines: { line1: '', line2: null },
    schedule: emptySchedule,
    requirementLabels: resolveListVenuePosterFactLabels(card),
  };
};
