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
  locationId: z.string().min(1),
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
  images: z.array(z.string()).default([]),
  bannerUrl: optionalHttpUrlSchema,
  hostId: z.string().optional(),
  pricingMode: z.enum(['free', 'shared', 'paid']).optional(),
  outingCategory: outingCategorySchema.optional(),
  outingTopic: outingTopicSchema.optional(),
  clonedFromActivityId: z.string().uuid().optional(),
  linkedActivityId: z.string().uuid().nullable().optional(),
  linkedRideshareActivityId: z.string().uuid().nullable().optional(),
});

export const publishingTenantActivityCreateSchema = publishingTenantActivityFieldsSchema.superRefine((data, ctx) => {
  if (data.activityType === 'rideshare') return;
  if (data.description.trim().length < 20) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Description must be at least 20 characters.',
      path: ['description'],
    });
  }
});

export const publishingTenantActivityPatchSchema = publishingTenantActivityFieldsSchema.partial();

export type OperatorTenantActivityCreateInput = z.infer<typeof publishingTenantActivityCreateSchema>;
export type OperatorTenantActivityPatchInput = z.infer<typeof publishingTenantActivityPatchSchema>;
