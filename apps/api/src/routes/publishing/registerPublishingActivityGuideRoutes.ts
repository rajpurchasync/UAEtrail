import type { Router } from 'express';
import { z } from 'zod';
import { requireMembershipRole } from '../../middleware/tenant.js';
import { ORG_ACTIVITY_EDIT_ROLES } from '../../lib/org-permissions.js';
import { validate } from '../../middleware/validate.js';
import { listActivityGuidesForHost, syncActivityGuides } from '../../services/activity-guides.js';
import { idParamSchema } from './publishing-route-schemas.js';

const guideIdsSchema = z.object({
  guideUserIds: z.array(z.string().min(1)).max(20),
});

/** Assign on-ground guides for a publishing-workspace activity. */
export const registerPublishingActivityGuideRoutes = (hostActivitiesRouter: Router): void => {
  hostActivitiesRouter.get(
    '/:id/guides',
    requireMembershipRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const data = await listActivityGuidesForHost(id);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  hostActivitiesRouter.put(
    '/:id/guides',
    requireMembershipRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ params: idParamSchema, body: guideIdsSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { guideUserIds } = req.body as z.infer<typeof guideIdsSchema>;
        const data = await syncActivityGuides({
          activityId: id,
          actorUserId: req.auth!.userId,
          guideUserIds,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
