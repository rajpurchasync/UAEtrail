import { z } from 'zod';
import { resolveHostNote } from '@uaetrail/shared-types';
import { MembershipRole } from '../../domain/enums.js';

export const idParamSchema = z.object({ id: z.string().min(1) });
export const membershipIdSchema = z.object({ membershipId: z.string().min(1) });

/** Approve/reject payload for **activity** join requests (`/publishing/requests/:id`). */
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

export const membershipRoleToPrisma = (role: 'tenant_admin' | 'tenant_guide'): MembershipRole =>
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

export const hostParticipantRatingSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});
