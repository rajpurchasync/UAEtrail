import type { Router } from 'express';
import { z } from 'zod';
import { registerActivityRoute } from '../../lib/activity-routes.js';
import { validate } from '../../middleware/validate.js';
import {
  createActivityJoinInvite,
  createActivityJoinInvites,
  listActivityJoinInvitesSent,
} from '../../services/activity-invite.js';
import { eventIdParamSchema } from './schemas.js';

const activityInviteBodySchema = z
  .object({
    inviteeUserId: z.string().min(1).optional(),
    inviteeUserIds: z.array(z.string().min(1)).min(1).max(20).optional(),
  })
  .refine((body) => Boolean(body.inviteeUserId) || Boolean(body.inviteeUserIds?.length), {
    message: 'Provide inviteeUserId or inviteeUserIds.',
  });

/** Participation: host or going member invites another user to an activity (Join me). */
export const registerActivityJoinInviteRoutes = (router: Router): void => {
  registerActivityRoute(
    router,
    'get',
    '/:id/invites',
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id: activityId } = req.params as z.infer<typeof eventIdParamSchema>;
        const data = await listActivityJoinInvitesSent({
          activityId,
          fromUserId: req.auth!.userId,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  registerActivityRoute(
    router,
    'post',
    '/:id/invites',
    validate({ params: eventIdParamSchema, body: activityInviteBodySchema }),
    async (req, res, next) => {
      try {
        const { id: activityId } = req.params as z.infer<typeof eventIdParamSchema>;
        const body = req.body as z.infer<typeof activityInviteBodySchema>;
        if (body.inviteeUserIds?.length) {
          const data = await createActivityJoinInvites({
            activityId,
            fromUserId: req.auth!.userId,
            toUserIds: body.inviteeUserIds,
          });
          res.status(201).json({ data });
          return;
        }
        const data = await createActivityJoinInvite({
          activityId,
          fromUserId: req.auth!.userId,
          toUserId: body.inviteeUserId!,
        });
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
