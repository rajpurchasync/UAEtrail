import { z } from 'zod';

export const participantIntentKindSchema = z.enum([
  'hiking',
  'camping',
  'event',
  'guide',
  'rideshare',
  'other',
]);

export type ParticipantIntentKind = z.infer<typeof participantIntentKindSchema>;

const participantIntentFieldsSchema = z.object({
  kind: participantIntentKindSchema,
  title: z.string().trim().min(3).max(120),
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
});

const refineParticipantIntent = (
  body: z.infer<typeof participantIntentFieldsSchema>,
  ctx: z.RefinementCtx
) => {
  if ((body.kind === 'hiking' || body.kind === 'camping') && !body.preferredArea?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Pick a preferred destination.',
      path: ['preferredArea'],
    });
  }
  if (
    (body.kind === 'hiking' || body.kind === 'camping') &&
    (body.latitude == null || body.longitude == null)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Drop a going-from pin on the map.',
      path: ['latitude'],
    });
  }
  if (body.kind !== 'other' && !body.date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pick a date.', path: ['date'] });
  }
  if (body.kind === 'event' && (body.latitude == null || body.longitude == null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Drop a location pin on the map.',
      path: ['latitude'],
    });
  }
  if (body.kind === 'rideshare') {
    if (body.latitude == null || body.longitude == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Drop a from pin on the map.', path: ['latitude'] });
    }
    if (body.toLatitude == null || body.toLongitude == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Drop a to pin on the map.', path: ['toLatitude'] });
    }
  }
};

export const createParticipantIntentSchema = participantIntentFieldsSchema.superRefine(refineParticipantIntent);

export type CreateParticipantIntentInput = z.infer<typeof createParticipantIntentSchema>;

export const updateParticipantIntentSchema = participantIntentFieldsSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required.',
  });

export type UpdateParticipantIntentInput = z.infer<typeof updateParticipantIntentSchema>;

/** Full validation after merging an active intent with a PATCH body. */
export const parseMergedParticipantIntent = (body: CreateParticipantIntentInput) =>
  createParticipantIntentSchema.parse(body);
