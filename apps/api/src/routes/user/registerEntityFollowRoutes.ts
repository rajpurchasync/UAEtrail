import type { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { followEntityForUser, unfollowEntityForUser } from '../../services/entity-follow-commands.js';
import { checkMeEntityFollowTarget, listMeEntityFollows } from '../../services/entity-follow-read.js';

const idParamSchema = z.object({ id: z.string().min(1) });

const followCreateSchema = z
  .object({
    locationId: z.string().optional(),
    tenantId: z.string().optional(),
    merchantId: z.string().optional(),
  })
  .refine(
    (d) => [d.locationId, d.tenantId, d.merchantId].filter(Boolean).length === 1,
    { message: 'Specify exactly one of locationId, tenantId, merchantId.' }
  );

export const registerEntityFollowRoutes = (router: Router): void => {
  router.get('/me/entity-follows', async (req, res, next) => {
    try {
      const data = await listMeEntityFollows(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/me/entity-follows',
    validate({ body: followCreateSchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof followCreateSchema>;
        const data = await followEntityForUser(req.auth!.userId, body);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/me/entity-follows/:id',
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        await unfollowEntityForUser(req.auth!.userId, id);
        res.json({ ok: true });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/me/entity-follows/check', async (req, res, next) => {
    try {
      const data = await checkMeEntityFollowTarget({
        followerId: req.auth!.userId,
        locationId: req.query.locationId as string | undefined,
        tenantId: req.query.tenantId as string | undefined,
        merchantId: req.query.merchantId as string | undefined,
      });
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
