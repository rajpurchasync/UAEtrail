import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  approveAdminCommunityMember,
  createAdminCommunityInvite,
  createAdminDiscoverableCommunity,
  setAdminCommunityStatus,
} from '../../services/admin-community-commands.js';
import { listAdminDiscoverableCommunities, loadAdminCommunityDetail } from '../../services/admin-community-read.js';

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
  adminUserId: z.string().min(1).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

const idParamSchema = z.object({ id: z.string().min(1) });

const suspendCommentSchema = z.object({
  comment: z.string().trim().max(500).optional(),
});

const requireSuspendComment = (
  data: { comment?: string },
  isSuspend: boolean,
  ctx: z.RefinementCtx
): void => {
  if (isSuspend && (!data.comment || data.comment.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Comment is required when suspending.',
      path: ['comment'],
    });
  }
};

const communityStatusSchema = suspendCommentSchema
  .extend({
    status: z.enum(['active', 'suspended']),
  })
  .superRefine((data, ctx) => requireSuspendComment(data, data.status === 'suspended', ctx));

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

  adminRouter.get('/communities/:id', validate({ params: idParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const data = await loadAdminCommunityDetail(id);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.post('/communities', validate({ body: communityCreateSchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof communityCreateSchema>;
      const data = await createAdminDiscoverableCommunity({
        ...body,
        adminUserId: body.adminUserId ?? req.auth!.userId,
      });
      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.patch(
    '/communities/:id/status',
    validate({ params: idParamSchema, body: communityStatusSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { status, comment } = req.body as z.infer<typeof communityStatusSchema>;
        const data = await setAdminCommunityStatus({
          actorId: req.auth!.userId,
          communityId: id,
          status,
          comment,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  const communityInviteBodySchema = z
    .object({
      email: z.string().email().optional(),
      userId: z.string().min(1).optional(),
    })
    .refine((body) => Boolean(body.email || body.userId), {
      message: 'Provide email or userId',
    });

  adminRouter.post(
    '/communities/:id/invites',
    validate({ params: idParamSchema, body: communityInviteBodySchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const body = req.body as z.infer<typeof communityInviteBodySchema>;
        await createAdminCommunityInvite({
          actorId: req.auth!.userId,
          communityId: id,
          email: body.email,
          userId: body.userId,
        });
        res.status(201).json({ data: { ok: true } });
      } catch (error) {
        next(error);
      }
    }
  );

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