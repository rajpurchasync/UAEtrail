import { z } from 'zod';
import { paginationSchema } from './pagination.js';

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Expected YYYY-MM-DD' });

/** Tenant publishing list filters for plan hosting hub (not explore map). */
export const publishingTenantActivitiesListQuerySchema = paginationSchema.extend({
  status: z.enum(['draft', 'published', 'cancelled', 'suspended']).optional(),
  startAtGte: isoDateSchema.optional(),
  startAtLt: isoDateSchema.optional(),
  /** When set with startAtGte + startAtLt: events with startAt strictly outside [gte, lt). */
  windowOutside: z
    .union([z.literal('1'), z.literal('true'), z.literal('0'), z.literal('false')])
    .optional()
    .transform((value) => value === '1' || value === 'true'),
  order: z.enum(['asc', 'desc']).default('asc'),
  upcomingFromToday: z
    .union([z.literal('1'), z.literal('true'), z.literal('0'), z.literal('false')])
    .optional()
    .transform((value) => value === '1' || value === 'true'),
});

export type PublishingTenantActivitiesListQuery = z.infer<
  typeof publishingTenantActivitiesListQuerySchema
>;

export const parsePublishingListDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map((part) => Number(part));
  return new Date(y, m - 1, d);
};
