import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  approveAdminCommunityMember,
  createAdminDiscoverableCommunity,
} from '../../services/admin-community-commands.js';
import { listAdminDiscoverableCommunities } from '../../services/admin-community-read.js';

const geoRefSchema = z.object({
  chain: z.array(z.string()),
  countryId: z.string().min(1),
  stateId: z.string().min(1),
  areaId: z.string().min(1),
  path: z.string().min(1),
  names: z.object({
    country: z.string().min(1),
    state: z.string().min(1),
    area: z.string().min(1),
    venue: z.string().optional(),
  }),
  venueId: z.string().optional(),
  searchTokens: z.array(z.string()),
});

const communityCreateSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  summary: z.string().max(2000).nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  visibility: z.enum(['public', 'private']),
  joinPolicy: z.enum(['open', 'request', 'invite']),
  geoRef: geoRefSchema,
  status: z.enum(['active', 'suspended']).optional(),
});

const communityMemberParamsSchema = z.object({
  communityId: z.string().min(1),
  userId: z.string().min(1),
});

/** Platform admin discoverable communities (`MIG-COMMUNITY-DISCOVER`). */
export const registerAdminCommunityRoutes = (adminRouter: Router): void => {
  adminRouter.get('/communities', async (_req, res, next) => {
    try {
      const data = await listAdminDiscoverableCommunities();
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.post('/communities', validate({ body: communityCreateSchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof communityCreateSchema>;
      const data = await createAdminDiscoverableCommunity(body);
      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.post(
    '/communities/:communityId/members/:userId/approve',
    validate({ params: communityMemberParamsSchema }),
    async (req, res, next) => {
      try {
        const { communityId, userId } = req.params as z.infer<typeof communityMemberParamsSchema>;
        const data = await approveAdminCommunityMember(communityId, userId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};