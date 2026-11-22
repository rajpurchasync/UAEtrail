import { z } from 'zod';
import type { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { joinDiscoverableCommunity } from '../../services/community-discover-commands.js';
import { createMeDiscoverableCommunity } from '../../services/me-community-discover-commands.js';
import { loadMeCommunityDiscoverList } from '../../services/me-community-discover-read.js';
import {
  leaveDiscoverableCommunity,
  patchCommunityProfileByHost,
  approveCommunityMemberByHost,
  inviteCommunityMemberByHost,
  addCommunityCoAdminByHost,
  linkPublishedActivityToDiscoverCommunity,
  removeCommunityCoAdminByHost,
  removeCommunityMemberByHost,
  setCommunityStatusByHost,
} from '../../services/community-host-commands.js';
import { loadCommunityHostManageSurface } from '../../services/community-host-read.js';

const communityIdParamSchema = z.object({ communityId: z.string().min(1) });

const memberUserParamSchema = z.object({
  communityId: z.string().min(1),
  userId: z.string().min(1),
});

const communityActivityParamSchema = z.object({
  communityId: z.string().min(1),
  activityId: z.string().min(1),
});

const communityInviteBodySchema = z
  .object({
    email: z.string().email().optional(),
    userId: z.string().min(1).optional(),
  })
  .refine((body) => Boolean(body.email?.trim() || body.userId), {
    message: 'Provide email or userId for the invite.',
  });

const approveMemberParamSchema = z.object({
  communityId: z.string().min(1),
  userId: z.string().min(1),
});

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

const createCommunitySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/).optional(),
  summary: z.string().max(500).nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  visibility: z.enum(['public', 'private']),
  joinPolicy: z.enum(['open', 'request', 'invite']),
  geoRef: geoRefSchema,
});

const communityStatusBodySchema = z.object({
  status: z.enum(['active', 'suspended']),
});

const hostProfilePatchSchema = z.object({
  summary: z.string().max(500).nullable().optional(),
  description: z.string().max(8000).nullable().optional(),
  policies: z.string().max(8000).nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
});

export const registerMeCommunityDiscoverRoutes = (router: Router): void => {
  router.get('/me/communities', async (req, res, next) => {
    try {
      const data = await loadMeCommunityDiscoverList(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/me/communities',
    validate({ body: createCommunitySchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof createCommunitySchema>;
        const data = await createMeDiscoverableCommunity(req.auth!.userId, req.auth!.email, {
          name: body.name,
          slug: body.slug,
          summary: body.summary,
          bannerUrl: body.bannerUrl,
          visibility: body.visibility,
          joinPolicy: body.joinPolicy,
          geoRef: body.geoRef,
        });
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/communities/:communityId/join',
    validate({ params: communityIdParamSchema }),
    async (req, res, next) => {
      try {
        const { communityId } = req.params as z.infer<typeof communityIdParamSchema>;
        const data = await joinDiscoverableCommunity(req.auth!.userId, communityId, req.auth!.email);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/communities/:communityId/leave',
    validate({ params: communityIdParamSchema }),
    async (req, res, next) => {
      try {
        const { communityId } = req.params as z.infer<typeof communityIdParamSchema>;
        const data = await leaveDiscoverableCommunity(req.auth!.userId, req.auth!.email, communityId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/me/communities/:communityId/host-manage',
    validate({ params: communityIdParamSchema }),
    async (req, res, next) => {
      try {
        const { communityId } = req.params as z.infer<typeof communityIdParamSchema>;
        const data = await loadCommunityHostManageSurface(req.auth!.userId, communityId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/communities/:communityId/members/:userId/approve',
    validate({ params: approveMemberParamSchema }),
    async (req, res, next) => {
      try {
        const { communityId, userId } = req.params as z.infer<typeof approveMemberParamSchema>;
        const data = await approveCommunityMemberByHost(
          req.auth!.userId,
          req.auth!.email,
          communityId,
          userId
        );
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/communities/:communityId/invites',
    validate({ params: communityIdParamSchema, body: communityInviteBodySchema }),
    async (req, res, next) => {
      try {
        const { communityId } = req.params as z.infer<typeof communityIdParamSchema>;
        const body = req.body as z.infer<typeof communityInviteBodySchema>;
        await inviteCommunityMemberByHost(req.auth!.userId, communityId, body);
        res.status(201).json({ data: { ok: true } });
      } catch (error) {
        next(error);
      }
    }
  );

  router.patch(
    '/me/communities/:communityId/profile',
    validate({ params: communityIdParamSchema, body: hostProfilePatchSchema }),
    async (req, res, next) => {
      try {
        const { communityId } = req.params as z.infer<typeof communityIdParamSchema>;
        const body = req.body as z.infer<typeof hostProfilePatchSchema>;
        const data = await patchCommunityProfileByHost(
          req.auth!.userId,
          req.auth!.email,
          communityId,
          body
        );
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/communities/:communityId/activities/:activityId/link',
    validate({ params: communityActivityParamSchema }),
    async (req, res, next) => {
      try {
        const { communityId, activityId } = req.params as z.infer<typeof communityActivityParamSchema>;
        const data = await linkPublishedActivityToDiscoverCommunity(
          req.auth!.userId,
          communityId,
          activityId
        );
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/communities/:communityId/members/:userId/remove',
    validate({ params: memberUserParamSchema }),
    async (req, res, next) => {
      try {
        const { communityId, userId } = req.params as z.infer<typeof memberUserParamSchema>;
        const data = await removeCommunityMemberByHost(req.auth!.userId, req.auth!.email, communityId, userId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.patch(
    '/me/communities/:communityId/status',
    validate({ params: communityIdParamSchema, body: communityStatusBodySchema }),
    async (req, res, next) => {
      try {
        const { communityId } = req.params as z.infer<typeof communityIdParamSchema>;
        const { status } = req.body as z.infer<typeof communityStatusBodySchema>;
        const data = await setCommunityStatusByHost(req.auth!.userId, req.auth!.email, communityId, status);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/communities/:communityId/admins/:userId',
    validate({ params: memberUserParamSchema }),
    async (req, res, next) => {
      try {
        const { communityId, userId } = req.params as z.infer<typeof memberUserParamSchema>;
        const data = await addCommunityCoAdminByHost(req.auth!.userId, communityId, userId);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/me/communities/:communityId/admins/:userId',
    validate({ params: memberUserParamSchema }),
    async (req, res, next) => {
      try {
        const { communityId, userId } = req.params as z.infer<typeof memberUserParamSchema>;
        const data = await removeCommunityCoAdminByHost(req.auth!.userId, communityId, userId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};