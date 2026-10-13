import type { Router } from 'express';
import { z } from 'zod';
import type { EntityFollowKind } from '@uaetrail/shared-types';
import { validate } from '../../middleware/validate.js';
import {
  findEntityFollow,
  followEntity,
  listEntityFollowsWithDetails,
  unfollowEntityById,
} from '../../lib/entity-follow-store.js';
import { ApiError } from '../../lib/api-error.js';

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

const resolveCreateTarget = (
  body: z.infer<typeof followCreateSchema>
): { kind: EntityFollowKind; targetId: string } => {
  if (body.locationId) return { kind: 'location', targetId: body.locationId };
  if (body.tenantId) return { kind: 'tenant', targetId: body.tenantId };
  if (body.merchantId) return { kind: 'merchant', targetId: body.merchantId! };
  throw new ApiError(400, 'invalid_follow', 'Specify exactly one follow target.');
};

export const registerEntityFollowRoutes = (router: Router): void => {
  router.get('/me/entity-follows', async (req, res, next) => {
    try {
      const data = await listEntityFollowsWithDetails(req.auth!.userId);
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
        const { kind, targetId } = resolveCreateTarget(body);
        const data = await followEntity(req.auth!.userId, kind, targetId);
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
        await unfollowEntityById(req.auth!.userId, id);
        res.json({ ok: true });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/me/entity-follows/check', async (req, res, next) => {
    try {
      const followerId = req.auth!.userId;
      const locationId = req.query.locationId as string | undefined;
      const tenantId = req.query.tenantId as string | undefined;
      const merchantId = req.query.merchantId as string | undefined;
      const targets = [
        locationId ? { kind: 'location' as const, targetId: locationId } : null,
        tenantId ? { kind: 'tenant' as const, targetId: tenantId } : null,
        merchantId ? { kind: 'merchant' as const, targetId: merchantId } : null,
      ].filter((row): row is { kind: EntityFollowKind; targetId: string } => row !== null);
      if (targets.length !== 1) {
        throw new ApiError(400, 'invalid_follow', 'Specify exactly one of locationId, tenantId, merchantId.');
      }
      const row = await findEntityFollow({ followerId, ...targets[0] });
      res.json({ data: { following: Boolean(row), followId: row?.id ?? null } });
    } catch (error) {
      next(error);
    }
  });
};
