import { ActivityType, Difficulty, LocationStatus, Prisma } from '@prisma/client';
import type { LocationSubmitBody } from '../domain/location-submit.js';

const toPrismaActivityType = (activityType: 'hiking' | 'camping'): ActivityType =>
  activityType === 'hiking' ? ActivityType.HIKING : ActivityType.CAMPING;

const toPrismaDifficulty = (difficulty?: 'easy' | 'moderate' | 'hard'): Difficulty | undefined => {
  if (!difficulty) return undefined;
  if (difficulty === 'easy') return Difficulty.EASY;
  if (difficulty === 'moderate') return Difficulty.MODERATE;
  return Difficulty.HARD;
};

export const buildLocationCreateData = (
  body: LocationSubmitBody,
  submittedById: string
): Prisma.LocationCreateInput => ({
  name: body.name,
  countryCode: body.countryCode.toUpperCase(),
  emirate: body.emirate,
  region: body.region,
  activityType: toPrismaActivityType(body.activityType),
  description: body.description,
  difficulty: toPrismaDifficulty(body.difficulty),
  distance: body.distance,
  duration: body.duration,
  elevation: body.elevation,
  surfaceType: body.surfaceType ?? [],
  highlights: body.highlights ?? [],
  tags: body.tags ?? [],
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
  status: LocationStatus.DRAFT,
  submittedBy: { connect: { id: submittedById } }
});
