import { z } from 'zod';

export const participantIntentKindSchema = z.enum([
  'hiking',
  'camping',
  'event',
  'guide',
  'carpool',
  'other',
]);

export type ParticipantIntentKind = z.infer<typeof participantIntentKindSchema>;

export const createParticipantIntentSchema = z
  .object({
    kind: participantIntentKindSchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
    preferredArea: z.string().trim().max(200).optional().nullable(),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    locationPrecision: z.enum(['general', 'specific']).optional(),
    toLatitude: z.number().min(-90).max(90).optional().nullable(),
    toLongitude: z.number().min(-180).max(180).optional().nullable(),
    partySize: z.number().int().min(1).max(50),
    comment: z.string().trim().min(3).max(1000),
  })
  .superRefine((body, ctx) => {
    if (body.kind === 'hiking' && !body.preferredArea?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a preferred area.', path: ['preferredArea'] });
    }
    if (body.kind !== 'other' && !body.date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pick a date.', path: ['date'] });
    }
    if (body.kind === 'carpool') {
      if (body.latitude == null || body.longitude == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Drop a from pin on the map.', path: ['latitude'] });
      }
      if (body.toLatitude == null || body.toLongitude == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Drop a to pin on the map.', path: ['toLatitude'] });
      }
    }
  });

export type CreateParticipantIntentInput = z.infer<typeof createParticipantIntentSchema>;
