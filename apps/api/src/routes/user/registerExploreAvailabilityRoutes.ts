import type { Router } from 'express';
import { z } from 'zod';
import { AVAILABILITY_KINDS, type AvailabilityKind } from '@uaetrail/shared-types';

const availabilityKindEnum = z.enum(
  AVAILABILITY_KINDS as unknown as [AvailabilityKind, ...AvailabilityKind[]]
);
import { optionalAuth } from '../../middleware/optional-auth.js';
import { ApiError } from '../../lib/api-error.js';
import { validate } from '../../middleware/validate.js';
import { loadExplorePeopleAvailability } from '../../services/explore-availability-read.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const exploreAvailabilityQuerySchema = z.object({
  from: isoDate,
  to: isoDate,
  kind: availabilityKindEnum.optional(),
  area: z.string().trim().max(80).optional(),
  region: z.string().trim().max(80).optional(),
  friendsOnly: z.enum(['0', '1']).optional(),
});

/** Explore People — who is available in a date range (clusters + rows). */
export const registerExploreAvailabilityRoutes = (router: Router): void => {
  router.get(
    '/explore/people/availability',
    optionalAuth,
    validate({ query: exploreAvailabilityQuerySchema }),
    async (req, res, next) => {
      try {
        const q = req.query as z.infer<typeof exploreAvailabilityQuerySchema>;
        if (q.friendsOnly === '1' && !req.auth?.userId) {
          throw new ApiError(401, 'unauthorized', 'Authentication is required for friends-only availability');
        }
        const data = await loadExplorePeopleAvailability({
          viewerUserId: req.auth?.userId ?? null,
          rangeStart: q.from,
          rangeEnd: q.to,
          kind: q.kind ?? null,
          areaSlug: q.area ?? null,
          region: q.region ?? null,
          friendsOnly: q.friendsOnly === '1',
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
