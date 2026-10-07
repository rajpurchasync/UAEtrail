import { z } from 'zod';

const WITHDRAW_REASON_VALUES = [
  'schedule_conflict',
  'cant_attend',
  'found_other',
  'health',
  'changed_mind',
  'other'
] as const;

export const withdrawReasonSchema = z
  .object({
    reason: z.enum(WITHDRAW_REASON_VALUES),
    message: z.string().max(500).optional()
  })
  .superRefine((data, ctx) => {
    if (!data.message || data.message.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A short comment for the host is required.',
        path: ['message'],
      });
    }
  });

export const canWithdrawRequest = (status: string): boolean =>
  status === 'pending' || status === 'approved' || status === 'waitlisted';
