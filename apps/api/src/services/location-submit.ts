import {
  deriveVenueAccessibilityFromAccessibleBy,
  encodeCommunityShopTags,
  isAddableFacilityPlaceKind,
  mergeVenueAreaTag,
  stampGroupRegionLevelsFromGeo,
  tagsForPlaceKind,
  type PlaceKind,
} from '@uaetrail/shared-types';
import { Accessibility } from '../domain/enums.js';
import { ActivityType, Difficulty, LocationStatus } from '../domain/enums.js';
import { toPrismaActivityType } from '../domain/activity-type.js';
import type { LocationSubmitBody } from '../domain/location-submit.js';

const toActivityType = (
  activityType: LocationSubmitBody['activityType']
): ActivityType => toPrismaActivityType(activityType);

const toDifficulty = (difficulty?: 'easy' | 'moderate' | 'hard'): Difficulty | undefined => {
  if (!difficulty) return undefined;
  if (difficulty === 'easy') return Difficulty.EASY;
  if (difficulty === 'moderate') return Difficulty.MODERATE;
  return Difficulty.HARD;
};

export type LocationCreateData = {
  name: string;
  countryCode: string;
  groupRegionLevels?: import('@uaetrail/shared-types').GroupRegionLevels | null;
  region: string;
  areaLabel?: string | null;
  areaId?: string | null;
  childFriendly?: boolean;
  accessibility?: Accessibility;
  activityType: ActivityType;
  description: string;
  difficulty?: Difficulty;
  distance?: number;
  duration?: number;
  elevation?: number;
  surfaceType: string[];
  highlights: string[];
  tags: string[];
  accessibleBy: string[];
  latitude?: number;
  longitude?: number;
  parkingLat?: number;
  parkingLng?: number;
  images: string[];
  premiumImages: string[];
  gpxKey: string | null;
  guidePdfKey: string | null;
  guideMarkdown: string | null;
  season: string[];
  status: LocationStatus;
  registryListed: boolean;
  submittedBy: { connect: { id: string } };
};

const isShopSubmit = (body: LocationSubmitBody): boolean => body.activityType.toLowerCase() === 'shop';

const toAccessibility = (
  body: LocationSubmitBody
): Accessibility | undefined => {
  if (body.accessibility === 'car-accessible') return Accessibility.CAR_ACCESSIBLE;
  if (body.accessibility === 'remote') return Accessibility.REMOTE;
  return deriveVenueAccessibilityFromAccessibleBy(body.accessibleBy) === 'car-accessible'
    ? Accessibility.CAR_ACCESSIBLE
    : deriveVenueAccessibilityFromAccessibleBy(body.accessibleBy) === 'remote'
      ? Accessibility.REMOTE
      : undefined;
};

export const buildLocationCreateData = (
  body: LocationSubmitBody,
  submittedById: string
): LocationCreateData => {
  const shop = isShopSubmit(body);
  const facilityKind =
    body.facilityKind && isAddableFacilityPlaceKind(body.facilityKind as PlaceKind)
      ? (body.facilityKind as PlaceKind)
      : null;
  const shopTags = shop
    ? encodeCommunityShopTags({
        searchKeywords: body.shopSearchKeywords ?? '',
        deliveryOffered: body.shopDeliveryOffered === true,
        deliveryRadiusKm: body.shopDeliveryRadiusKm ?? null,
        contactEmail: body.shopContactEmail,
        contactPhoneE164: body.shopContactPhoneE164,
      })
    : [];
  const shopHighlights = body.highlights ?? [];

  const baseTags = shop ? shopTags : body.tags ?? [];
  let tags = shop ? baseTags : mergeVenueAreaTag(baseTags, body.areaLabel);
  if (facilityKind) {
    const kindTags = tagsForPlaceKind(facilityKind);
    tags = [...new Set([...tags, ...kindTags])];
  }

  const stateHint = body.groupRegion ?? body.emirate ?? null;
  const groupRegionLevels = stampGroupRegionLevelsFromGeo({
    countryCode: body.countryCode.toUpperCase(),
    region: body.region,
    areaLabel: body.areaLabel,
    stateHint,
    latitude: body.latitude,
    longitude: body.longitude,
    areaId: body.areaId,
  });

  return {
  name: body.name,
  countryCode: body.countryCode.toUpperCase(),
  groupRegionLevels,
  region: body.region,
  areaLabel: body.areaLabel?.trim() || null,
  areaId: body.areaId?.trim() || '',
  activityType: facilityKind ? ActivityType.EVENT : toActivityType(body.activityType),
  description: body.description,
  difficulty: shop ? undefined : toDifficulty(body.difficulty),
  distance: body.distance,
  duration: body.duration,
  elevation: body.elevation,
  childFriendly: body.childFriendly ?? false,
  accessibility: shop ? undefined : toAccessibility(body),
  surfaceType: body.surfaceType ?? [],
  highlights: shop ? shopHighlights : body.highlights ?? [],
  tags,
  accessibleBy: body.accessibleBy ?? [],
  latitude: body.latitude,
  longitude: body.longitude,
  parkingLat: body.parkingLat,
  parkingLng: body.parkingLng,
  images: body.images,
  premiumImages: body.premiumImages ?? [],
  gpxKey: body.gpxKey ?? null,
  guidePdfKey: body.guidePdfKey ?? null,
  guideMarkdown: body.guideMarkdown ?? null,
  season: ['year-round'],
  status: body.mapPin || body.activityAnchor ? LocationStatus.ACTIVE : LocationStatus.DRAFT,
  registryListed: body.mapPin || body.activityAnchor ? false : false,
  submittedBy: { connect: { id: submittedById } }
};
};
