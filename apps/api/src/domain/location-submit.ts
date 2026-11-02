import {
  ADDABLE_FACILITY_PLACE_KINDS,
  isAddableFacilityPlaceKind,
  type PlaceKind,
} from '@uaetrail/shared-types';
import { z } from 'zod';

const addableFacilityKindSchema = z.enum(
  ADDABLE_FACILITY_PLACE_KINDS as unknown as [string, ...string[]]
);

/** Accept absolute URLs or same-origin relative media paths from local dev uploads. */
export const mediaUrlSchema = z.string().min(1).refine(
  (value) => value.startsWith('/') || /^https?:\/\//i.test(value),
  { message: 'Invalid media URL' }
);

export const locationSubmitBodySchema = z.object({
  name: z.string().min(2).max(120),
  countryCode: z.string().length(2),
  /** UAE FE uses “emirate”; persisted as `groupRegionLevels.l2`. */
  emirate: z.string().min(2).max(80).optional(),
  groupRegion: z.string().min(2).max(80).optional(),
  region: z.string().min(2).max(80),
  /** Admin-registered area — required unless proposing a new area from a pin. */
  areaId: z.string().min(1).max(80).optional(),
  /** Host-proposed area when the pin is outside published area polygons. */
  proposedAreaName: z.string().min(2).max(80).optional(),
  areaLabel: z.string().min(2).max(120).optional(),
  childFriendly: z.boolean().optional(),
  accessibility: z.enum(['car-accessible', 'remote']).optional(),
  activityType: z.enum(['hiking', 'camping', 'event', 'shop', 'rideshare']),
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
  shopSearchKeywords: z.string().min(2).max(500).optional(),
  shopDeliveryOffered: z.boolean().optional(),
  shopDeliveryRadiusKm: z.number().positive().max(1000).optional(),
  shopContactEmail: z.string().email().max(120).optional(),
  shopContactPhoneE164: z.string().min(8).max(24).optional(),
  /** Member/admin facility row — persisted via `place-kind:*` tags + `activityType: event`. */
  facilityKind: addableFacilityKindSchema.optional(),
}).superRefine((body, ctx) => {
  if (body.facilityKind) {
    if (!isAddableFacilityPlaceKind(body.facilityKind as PlaceKind)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid facility type.',
        path: ['facilityKind'],
      });
    }
    if (body.latitude == null || body.longitude == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pin the facility on the map.',
        path: ['latitude'],
      });
    }
    if (body.activityType.toLowerCase() === 'shop') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Facilities cannot use shop activity type.',
        path: ['activityType'],
      });
    }
    if (!body.areaId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose a published area.',
        path: ['areaId'],
      });
    }
    return;
  }
  const hasArea = Boolean(body.areaId?.trim());
  const proposing = Boolean(body.proposedAreaName?.trim());
  if (!hasArea && !proposing) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Choose a published area, or name a new one for this pin.',
      path: ['areaId'],
    });
  }
  if (proposing && (body.latitude == null || body.longitude == null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Pin the spot on the map to propose a new area.',
      path: ['latitude'],
    });
  }
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
