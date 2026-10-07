import type { ExploreCardModel } from '../explore/exploreCardModel';
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

const resolveVenuePlaceName = (card: ExploreCardModel): string => {
  const listTitle = card.listTitle?.trim();
  if (listTitle) return listTitle;
  const headline = card.headline?.trim();
  if (headline) return headline.split(' - ')[0]?.trim() || headline;
  return 'Outdoor place';
};

const resolveReachabilityLabel = (card: ExploreCardModel): string | null => {
  const accessibility = card.venueAccessibility;
  if (accessibility === 'remote') return '4x4 required';
  if (accessibility === 'car-accessible') return 'Sedan access';
  return null;
};

const resolveParkingLabel = (card: ExploreCardModel): string | null => {
  const parkingDetail = card.sections.details.find((d) => d.icon === 'parking');
  if (parkingDetail?.label?.trim()) return parkingDetail.label.trim();
  return null;
};

const resolveDifficultyLabel = (card: ExploreCardModel): string | null => {
  const difficulty = card.difficulty;
  if (!difficulty) return null;
  return capitalize(difficulty);
};

const resolveSurfaceLabels = (card: ExploreCardModel): string[] => {
  const surfaces = card.surfaceTypes ?? [];
  return surfaces.map((s) => capitalize(s.replace(/_/g, ' '))).filter(Boolean).slice(0, 2);
};

/** Fact pills on venue posters — hike vs camp matrix from `locationCard` projection on the card model. */
export const resolveListVenuePosterFactLabels = (card: ExploreCardModel): string[] => {
  if (card.source !== 'venue') return [];

  const labels: string[] = [];
  if (card.childFriendly) labels.push('Child-friendly');

  const parking = resolveParkingLabel(card);
  if (parking) labels.push(parking);

  if (card.kind === 'hiking') {
    const difficulty = resolveDifficultyLabel(card);
    if (difficulty) labels.push(difficulty);
  }

  if (card.kind === 'camping') {
    labels.push(...resolveSurfaceLabels(card));
  }

  const reach = resolveReachabilityLabel(card);
  if (reach) labels.push(reach);

  return [...new Set(labels)].slice(0, 4);
};

export type ListVenuePosterCopy = {
  placeLine: string | null;
  heroTitle: string;
  titleLines: ListFeedPosterTitleLines;
  schedule: BrowsePosterScheduleGrid;
  requirementLabels: string[];
};

export const resolveListVenuePosterCopy = (card: ExploreCardModel): ListVenuePosterCopy => {
  const heroTitle = resolveVenuePlaceName(card);
  const region = card.venueRegion?.trim() || card.subtitle?.trim() || null;

  return {
    placeLine: region,
    heroTitle,
    titleLines: formatListFeedPosterTitleLines(heroTitle, 6, 3),
    schedule: emptySchedule,
    requirementLabels: resolveListVenuePosterFactLabels(card),
  };
};
