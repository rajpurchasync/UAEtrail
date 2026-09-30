import { encodeShopContributeTags } from '@uaetrail/shared-types';
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
  emirate?: string;
  region: string;
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

export const buildLocationCreateData = (
  body: LocationSubmitBody,
  submittedById: string
): LocationCreateData => {
  const shop = isShopSubmit(body);
  const shopTags = shop
    ? encodeShopContributeTags({
        searchKeywords: body.shopSearchKeywords ?? '',
        deliveryOffered: body.shopDeliveryOffered === true,
        deliveryRadiusKm: body.shopDeliveryRadiusKm ?? null,
        contactEmail: body.shopContactEmail,
        contactPhoneE164: body.shopContactPhoneE164,
      })
    : [];
  const shopHighlights =
    shop && body.shopProductsServices?.trim()
      ? [body.shopProductsServices.trim()]
      : body.highlights ?? [];

  return {
  name: body.name,
  countryCode: body.countryCode.toUpperCase(),
  emirate: body.emirate,
  region: body.region,
  activityType: toActivityType(body.activityType),
  description: body.description,
  difficulty: shop ? undefined : toDifficulty(body.difficulty),
  distance: body.distance,
  duration: body.duration,
  elevation: body.elevation,
  surfaceType: body.surfaceType ?? [],
  highlights: shop ? shopHighlights : body.highlights ?? [],
  tags: shop ? shopTags : body.tags ?? [],
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
