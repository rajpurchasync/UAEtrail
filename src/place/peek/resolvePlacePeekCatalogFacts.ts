import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import type { Place } from '../../types/place';
import { capitalize } from '../../utils';

export type PlacePeekAudienceLabel = string;

export type PlacePeekTrailFacts = {
  distanceKm: string | null;
  difficulty: string | null;
  durationHours: string | null;
  elevationM: string | null;
};

export type PlacePeekCampFacts = {
  surface: string | null;
  campingStyle: string | null;
};

export type PlacePeekEventFacts = {
  routeKm: string | null;
  durationHours: string | null;
  capacity: string | null;
};

const formatKm = (km: number | null | undefined): string | null => {
  if (km == null || !Number.isFinite(km) || km <= 0) return null;
  return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
};

const formatDifficulty = (value: string | null | undefined): string | null => {
  if (!value?.trim()) return null;
  return capitalize(value.trim());
};

const formatDuration = (hours: number | null | undefined): string | null => {
  if (hours == null || !Number.isFinite(hours) || hours <= 0) return null;
  const rounded = hours % 1 === 0 ? String(hours) : hours.toFixed(1);
  return `${rounded} hr${hours === 1 ? '' : 's'}`;
};

const formatElevation = (meters: number | null | undefined): string | null => {
  if (meters == null || !Number.isFinite(meters) || meters <= 0) return null;
  return `${Math.round(meters)} m`;
};

const campingStyleLabel = (value: string | null | undefined): string | null => {
  if (!value) return null;
  if (value === 'self-guided') return 'Self-guided';
  if (value === 'operator-led') return 'Operator-led';
  return capitalize(value);
};

const audienceLabelsFromCard = (card: DiscoveryCardModel): PlacePeekAudienceLabel[] => {
  const labels: string[] = [];
  if (card.childFriendly) labels.push('Child-friendly');
  const badges = card.requirementBadges ?? [];
  for (const badge of badges) {
    const normalized = badge.trim();
    if (!normalized || normalized === 'Child-friendly') continue;
    if (labels.includes(normalized)) continue;
    labels.push(normalized);
  }
  return labels.slice(0, 4);
};

const audienceLabelsFromPlace = (place: Place): PlacePeekAudienceLabel[] => {
  const labels: string[] = [];
  if (place.childFriendly) labels.push('Child-friendly');
  return labels;
};

export const resolvePlacePeekTrailFactsFromCard = (card: DiscoveryCardModel): PlacePeekTrailFacts => ({
  distanceKm: formatKm(card.venueDistanceKm),
  difficulty: formatDifficulty(card.difficulty ?? null),
  durationHours: formatDuration(card.venueDurationHours),
  elevationM: formatElevation(card.venueElevationM),
});

export const resolvePlacePeekTrailFactsFromPlace = (place: Place): PlacePeekTrailFacts => ({
  distanceKm: formatKm(place.distance),
  difficulty: formatDifficulty(place.difficulty),
  durationHours: formatDuration(place.duration),
  elevationM: formatElevation(place.elevation),
});

export const resolvePlacePeekEventFactsFromPlace = (place: Place): PlacePeekEventFacts => ({
  routeKm: formatKm(place.distance),
  durationHours: formatDuration(place.duration),
  capacity:
    place.maxGroupSize != null && place.maxGroupSize > 0 ? String(place.maxGroupSize) : null,
});

export const resolvePlacePeekCampFactsFromCard = (card: DiscoveryCardModel): PlacePeekCampFacts => {
  const surfaces = card.surfaceTypes ?? [];
  const primary = surfaces[0]?.trim();
  const style = card.venueCampingType;
  return {
    surface: primary ? capitalize(primary.replace(/_/g, ' ')) : null,
    campingStyle:
      style === 'self-guided' ? 'Self-guided' : style === 'operator-led' ? 'Operator-led' : null,
  };
};

export const resolvePlacePeekCampFactsFromPlace = (place: Place): PlacePeekCampFacts => {
  const surfaces = place.surfaceType ?? [];
  const primary = surfaces[0]?.trim();
  return {
    surface: primary ? capitalize(primary.replace(/_/g, ' ')) : null,
    campingStyle: campingStyleLabel(place.campingType),
  };
};

export const resolvePlacePeekAudienceFromCard = (card: DiscoveryCardModel): PlacePeekAudienceLabel[] =>
  audienceLabelsFromCard(card);

export const resolvePlacePeekAudienceFromPlace = (place: Place): PlacePeekAudienceLabel[] =>
  audienceLabelsFromPlace(place);
