import { z } from 'zod';
import { resolveHostNote } from '@uaetrail/shared-types';
import { MembershipRole } from '../../domain/enums.js';

export const idParamSchema = z.object({ id: z.string().min(1) });
export const membershipIdSchema = z.object({ membershipId: z.string().min(1) });

/** Approve/reject payload for **activity** join requests (`/workspace/requests/:id`). */
export const activityRequestDecisionSchema = z
  .object({
    status: z.enum(['approved', 'rejected']),
    hostNote: z.string().max(300).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status !== 'rejected') return;
    const note = resolveHostNote(data);
    if (!note || note.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A short note is required when declining an activity join request.',
        path: ['hostNote'],
      });
    }
  });

export const teamCreateSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(80).optional(),
  role: z.enum(['tenant_admin', 'tenant_guide']),
});

export const teamPatchSchema = z.object({
  role: z.enum(['tenant_admin', 'tenant_guide']).optional(),
  isActive: z.boolean().optional(),
});

export const membershipRoleToStored = (role: 'tenant_admin' | 'tenant_guide'): MembershipRole =>
  role === 'tenant_admin' ? MembershipRole.TENANT_ADMIN : MembershipRole.TENANT_GUIDE;

export const hostParticipantRevokeSchema = z
  .object({
    hostNote: z.string().trim().min(3).max(300).optional(),
  })
  .superRefine((data, ctx) => {
    const note = resolveHostNote(data);
    if (!note || note.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A short note is required when removing a participant.',
        path: ['hostNote'],
      });
    }
  });

const rideshareRiderRatingDimensionsSchema = z.object({
  cleanliness: z.number().int().min(1).max(5),
  punctuality: z.number().int().min(1).max(5),
  behaviour: z.number().int().min(1).max(5),
  payment: z.number().int().min(1).max(5).optional().nullable(),
});

export const hostParticipantRatingSchema = z
  .object({
    score: z.number().int().min(1).max(5).optional(),
    comment: z.string().trim().max(500).optional(),
    rideshare: rideshareRiderRatingDimensionsSchema.optional(),
  })
  .superRefine((body, ctx) => {
    if (!body.rideshare && body.score == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Rating score is required.', path: ['score'] });
    }
  });
