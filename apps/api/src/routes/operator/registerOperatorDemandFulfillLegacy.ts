import type { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { findTenantActivityBasic } from '../../lib/activities-store.js';
import { fulfillParticipantIntent } from '../../lib/participant-intents-store.js';
import { requireOrgRole } from '../../middleware/tenant.js';
import { ORG_ACTIVITY_EDIT_ROLES } from '../../lib/org-permissions.js';
import { validate } from '../../middleware/validate.js';

const intentIdParamSchema = z.object({ intentId: z.string().min(1) });
const fulfillIntentBodySchema = z.object({
  activityId: z.string().min(1),
});

/**
 * @deprecated Third-party tenant fulfill — demand posters use
 * `POST /me/participant-intents/:intentId/link-activity`.
 */
export const registerOperatorDemandFulfillLegacyRoutes = (operatorRouter: Router): void => {
  operatorRouter.post(
    '/participant-intents/:intentId/fulfill',
    requireOrgRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ params: intentIdParamSchema, body: fulfillIntentBodySchema }),
    async (req, res, next) => {
      try {
        res.setHeader('Deprecation', 'true');
        res.setHeader(
          'Link',
          '</api/v1/me/participant-intents/{intentId}/link-activity>; rel="alternate"'
        );
        const { intentId } = req.params as z.infer<typeof intentIdParamSchema>;
        const { activityId } = req.body as z.infer<typeof fulfillIntentBodySchema>;
        const tenantId = req.tenantContext!.tenantId;
        const activity = await findTenantActivityBasic(activityId, tenantId);
        if (!activity) {
          throw new ApiError(404, 'activity_not_found', 'Activity not found.');
        }
        const intent = await fulfillParticipantIntent(intentId, activityId);
        if (!intent) {
          throw new ApiError(404, 'intent_not_found', 'Community request not found.');
        }
        res.json(intent);
      } catch (error) {
        next(error);
      }
    }
  );
};
