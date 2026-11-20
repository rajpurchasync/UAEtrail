import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import { browseCatalogEntityName, browseCatalogNormalize } from './browseCatalogLabels';

const capitalize = (value: string): string =>
  value.length ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const normalize = browseCatalogNormalize;

/** Trail / wadi line under emirate — subtitle when it differs from region eyebrow. */
const resolveVenueLocationFact = (card: DiscoveryCardModel): string | null => {
  const subtitle = card.subtitle?.trim();
  if (!subtitle) return null;
  const region = card.venueRegion?.trim();
  if (region && normalize(subtitle) === normalize(region)) return null;
  if (normalize(subtitle) === normalize(browseCatalogEntityName(card))) return null;
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

/** Registry trail length (hiking cards only) — not drive distance from the member. */
const resolveHikingTrailDistanceLabel = (card: DiscoveryCardModel): string | null => {
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

const resolveShopPosterFactLabels = (card: DiscoveryCardModel): string[] => {
  const labels: string[] = [];
  const region = card.venueRegion?.trim() || card.subtitle?.trim();
  if (region && normalize(region) !== normalize(browseCatalogEntityName(card))) {
    labels.push(region);
  }
  labels.push('Outdoor shop');
  return [...new Set(labels)].slice(0, 6);
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
  const distance = resolveHikingTrailDistanceLabel(card);
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
export const resolveVenueCatalogFactLabels = (
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
export const resolveVenueBrowseThumbnailFactLabels = (card: DiscoveryCardModel): string[] =>
  resolveVenueCatalogFactLabels(card);

const VENUE_BROWSE_CARD_FACT_LIMIT = 5;

const ACTIVITY_PLACE_LOGISTICS_CAP = 2;

/** S6 — inherited parking / reachability / amenity chips when an activity links a place (not S4 policy). */
export const resolveActivityLinkedPlaceLogisticsLabels = (card: DiscoveryCardModel): string[] => {
  if (card.source !== 'activity' || !card.locationId) return [];

  const labels: string[] = [];
  const reach = resolveReachabilityLabel(card);
  if (reach) labels.push(reach);

  const parking = resolveParkingLabel(card);
  if (parking && !labels.includes(parking)) labels.push(parking);

  for (const amenity of card.venueAmenityLabels ?? []) {
    const chip = amenity.trim();
    if (!chip) continue;
    if (chip === 'Parking' && labels.some((line) => line.includes('Parking'))) continue;
    if (!labels.includes(chip)) labels.push(chip);
    if (labels.length >= ACTIVITY_PLACE_LOGISTICS_CAP) break;
  }

  return labels.slice(0, ACTIVITY_PLACE_LOGISTICS_CAP);
};

/** Venues browse card chips — trail/camp logistics + amenities (policy/child-friendly lives on hero only). */
export const resolveVenueBrowseCardFactLabels = (card: DiscoveryCardModel): string[] => {
  if (card.source === 'shop') return ['Outdoor shop'];
  const kindFacts =
    card.kind === 'hiking'
      ? resolveHikingPlaceFactLabels(card).slice(0, 2)
      : card.kind === 'camping'
        ? resolveCampingPlaceFactLabels(card).slice(0, 2)
        : [];
  const shared = resolveSharedPlaceFactLabels(card).filter((label) => label !== 'Child-friendly');
  return [...new Set([...kindFacts, ...shared])].slice(0, VENUE_BROWSE_CARD_FACT_LIMIT);
};