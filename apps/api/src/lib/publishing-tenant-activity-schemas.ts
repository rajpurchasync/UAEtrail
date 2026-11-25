import { resolveActivityPlaceLinkId } from '@uaetrail/shared-types';
import { z } from 'zod';
import { sharedActivityTypeSchema } from '../domain/activity-type.js';

const optionalHttpUrlSchema = z
  .string()
  .max(2000)
  .optional()
  .nullable()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  })
  .refine(
    (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid http(s) URL' }
  );

const outingCategorySchema = z.enum(['hiking', 'camping', 'events', 'rideshare', 'activities']);
const outingTopicSchema = z.enum([
  'climbing',
  'trail_run',
  'road_run',
  'swim',
  'workshop',
  'community',
]);

const publishingTenantActivityFieldsSchema = z.object({
  activityType: sharedActivityTypeSchema,
  /** Catalog place id — Mongo `activities.locationId`. */
  locationId: z.string().min(1).optional(),
  /** Synonym for `locationId` (prefer in new clients). */
  placeId: z.string().min(1).optional(),
  title: z.string().min(4).max(120),
  description: z.string().min(1).max(5000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  meetingPoint: z.string().max(200).optional(),
  meetingLat: z.number().min(-90).max(90).optional(),
  meetingLng: z.number().min(-180).max(180).optional(),
  startPoint: z.string().max(500).optional(),
  startLat: z.number().min(-90).max(90).optional(),
  startLng: z.number().min(-180).max(180).optional(),
  parkingPoint: z.string().max(200).optional(),
  parkingLat: z.number().min(-90).max(90).optional(),
  parkingLng: z.number().min(-180).max(180).optional(),
  /** Consented start point for matching people leaving from the same place. Shown label is originLabel. */
  originLat: z.number().min(-90).max(90).optional(),
  originLng: z.number().min(-180).max(180).optional(),
  originLabel: z.string().max(160).optional(),
  meetingDifferent: z.boolean().optional(),
  rideshareEnabled: z.boolean().optional(),
  rideshareFree: z.boolean().optional(),
  ridesharePriceAed: z.number().int().min(0).optional(),
  rideshareSeats: z.number().int().min(1).optional(),
  rideshareDetails: z.string().max(1000).optional(),
  rideshareVehicleId: z.string().uuid().optional(),
  rideshareFromPoint: z.string().max(200).optional(),
  rideshareFromLat: z.number().min(-90).max(90).optional(),
  rideshareFromLng: z.number().min(-180).max(180).optional(),
  rideshareToPoint: z.string().max(200).optional(),
  rideshareToLat: z.number().min(-90).max(90).optional(),
  rideshareToLng: z.number().min(-180).max(180).optional(),
  paymentTerms: z.string().max(1000).optional(),
  itinerary: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  joinMode: z.enum(['open', 'private']).optional(),
  participationMode: z.enum(['rsvp', 'approval']).optional(),
  groupChatPostPolicy: z.enum(['all_participants', 'host_only']).optional(),
  price: z.number().int().min(0).default(0),
  capacity: z.number().int().positive(),
  waitlist: z.boolean().optional(),
  images: z.array(z.string()).default([]),
  bannerUrl: optionalHttpUrlSchema,
  hostId: z.string().optional(),
  guideUserIds: z.array(z.string().min(1)).max(20).optional(),
  pricingMode: z.enum(['free', 'shared', 'paid']).optional(),
  outingCategory: outingCategorySchema.optional(),
  outingTopic: outingTopicSchema.optional(),
  clonedFromActivityId: z.string().uuid().optional(),
  linkedActivityId: z.string().uuid().nullable().optional(),
  linkedRideshareActivityId: z.string().uuid().nullable().optional(),
  /** Discoverable club — `community_groups` id (`MIG-COMMUNITY-DISCOVER`). */
  discoverCommunityId: z.string().min(1).nullable().optional(),
  /** Crew-only — stored in `activity_private` (E.164 phone). */
  privateEmergencyContactName: z.string().trim().min(2).max(80).optional().nullable(),
  privateEmergencyContactPhone: z.string().trim().min(8).max(30).optional().nullable(),
  privateVehiclePlateNumber: z.string().trim().max(20).optional().nullable(),
});

export const publishingTenantActivityCreateSchema = publishingTenantActivityFieldsSchema
  .superRefine((data, ctx) => {
    const placeLinkId = resolveActivityPlaceLinkId(data);
    if (!placeLinkId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide locationId or placeId (catalog place).',
        path: ['locationId'],
      });
    } else if (data.locationId && data.placeId && data.locationId.trim() !== data.placeId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'locationId and placeId must match when both are sent.',
        path: ['placeId'],
      });
    }
    if (data.activityType === 'rideshare') return;
    if (data.description.trim().length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Description must be at least 20 characters.',
        path: ['description'],
      });
    }
  })
  .transform((data) => ({
    ...data,
    locationId: resolveActivityPlaceLinkId(data)!,
  }));

export const publishingTenantActivityPatchSchema = publishingTenantActivityFieldsSchema
  .partial()
  .superRefine((data, ctx) => {
    if (!data.locationId && !data.placeId) return;
    const placeLinkId = resolveActivityPlaceLinkId(data);
    if (!placeLinkId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'locationId and placeId must match when both are sent.',
        path: ['placeId'],
      });
    }
  })
  .transform((data) => {
    const placeLinkId = resolveActivityPlaceLinkId(data);
    if (!placeLinkId) return data;
    return { ...data, locationId: placeLinkId };
  });

export type OperatorTenantActivityCreateInput = z.infer<typeof publishingTenantActivityCreateSchema>;
export type OperatorTenantActivityPatchInput = z.infer<typeof publishingTenantActivityPatchSchema>;
