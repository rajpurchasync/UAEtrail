import { z } from 'zod';

/** Accept absolute URLs or same-origin relative media paths from local dev uploads. */
const mediaUrlSchema = z.string().min(1).refine(
  (value) => value.startsWith('/') || /^https?:\/\//i.test(value),
  { message: 'Invalid media URL' }
);

export const locationSubmitBodySchema = z.object({
  name: z.string().min(2).max(120),
  countryCode: z.string().length(2).default('AE'),
  emirate: z.string().min(2).max(80).optional(),
  region: z.string().min(2).max(80),
  activityType: z.enum([
    'hiking',
    'camping',
    'event',
    'shop',
    'rideshare',
    'EVENT',
    'COMMUNITY_ACTIVITY',
    'community_activity',
  ]),
  description: z.string().min(20).max(3000),
  difficulty: z.enum(['easy', 'moderate', 'hard']).optional(),
  distance: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  elevation: z.number().int().nonnegative().optional(),
  surfaceType: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  accessibleBy: z.array(z.string()).default([]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  parkingLat: z.number().min(-90).max(90).optional(),
  parkingLng: z.number().min(-180).max(180).optional(),
  images: z.array(mediaUrlSchema).min(1),
  gpxKey: z.string().max(500).optional().nullable(),
  guidePdfKey: z.string().max(500).optional().nullable(),
  guideMarkdown: z.string().max(50000).optional().nullable(),
  premiumImages: z.array(mediaUrlSchema).default([]),
  /** When true, publish the pin immediately (legacy mobile quick-create). */
  mapPin: z.boolean().optional(),
  /** Activity-only anchor — not listed in the public place registry or venue map pins. */
  activityAnchor: z.boolean().optional(),
  /** Community shop pin — encoded into highlights/tags on submit. */
  shopProductsServices: z.string().min(2).max(2000).optional(),
  shopSearchKeywords: z.string().min(2).max(500).optional(),
  shopDeliveryOffered: z.boolean().optional(),
  shopDeliveryRadiusKm: z.number().positive().max(1000).optional(),
  shopContactEmail: z.string().email().max(120).optional(),
  shopContactPhoneE164: z.string().min(8).max(24).optional(),
}).superRefine((body, ctx) => {
  if (body.activityType.toLowerCase() !== 'shop') return;
  if (body.latitude == null || body.longitude == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Pin the shop on the map.',
      path: ['latitude'],
    });
  }
  if (body.shopDeliveryOffered === true && body.shopDeliveryRadiusKm == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Choose a delivery distance.',
      path: ['shopDeliveryRadiusKm'],
    });
  }
});

export type LocationSubmitBody = z.infer<typeof locationSubmitBodySchema>;
