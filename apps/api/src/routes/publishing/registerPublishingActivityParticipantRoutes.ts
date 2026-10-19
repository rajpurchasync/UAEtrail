import type { Router } from 'express';
import { z } from 'zod';
import { resolveHostNote } from '@uaetrail/shared-types';
import { createAuditLog } from '../../lib/audit.js';
import { ORG_ACTIVITY_EDIT_ROLES } from '../../lib/org-permissions.js';
import { requireOrgRole } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import { performParticipantCheckIn } from '../../services/checkin.js';
import { undoTenantActivityParticipantCheckIn } from '../../services/publishing-activity-participant-commands.js';
import { loadTenantActivityParticipantRoster } from '../../services/publishing-activity-participant-read.js';
import {
  rateActivityParticipantAsHost,
  revokeActivityParticipantAsHost,
} from '../../services/participant-roster-host.js';
import {
  hostParticipantRatingSchema,
  hostParticipantRevokeSchema,
  idParamSchema,
} from './publishing-route-schemas.js';

const participantIdSchema = z.object({
  id: z.string().min(1),
  participantId: z.string().min(1),
});

/**
 * Host console roster for **activity** participants (`activity_participants`).
 * Mounted under `/host/activities/:id/participants/*` — same Activity entity as public browse.
 */
export const registerPublishingActivityParticipantRoutes = (hostActivitiesRouter: Router): void => {
  hostActivitiesRouter.get('/:id/participants', validate({ params: idParamSchema }), async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const data = await loadTenantActivityParticipantRoster(tenantId, id);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  hostActivitiesRouter.post(
    '/:id/participants/:participantId/checkin',
    requireOrgRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ params: participantIdSchema }),
    async (req, res, next) => {
      try {
        const tenantId = req.tenantContext!.tenantId;
        const { id, participantId } = req.params as z.infer<typeof participantIdSchema>;

        const result = await performParticipantCheckIn({
          activityId: id,
          participantId,
          actorUserId: req.auth!.userId,
          tenantId,
        });

        res.json({
          message: result.alreadyCheckedIn ? 'Participant already checked in.' : 'Participant checked in.',
          checkedInAt: result.checkedInAt.toISOString(),
        });
      } catch (error) {
        next(error);
      }
    }
  );

  hostActivitiesRouter.delete(
    '/:id/participants/:participantId/checkin',
    requireOrgRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ params: participantIdSchema }),
    async (req, res, next) => {
      try {
        const tenantId = req.tenantContext!.tenantId;
        const { id, participantId } = req.params as z.infer<typeof participantIdSchema>;

        await undoTenantActivityParticipantCheckIn({
          tenantId,
          activityId: id,
          participantId,
          actorUserId: req.auth!.userId,
        });

        res.json({ message: 'Check-in undone.' });
      } catch (error) {
        next(error);
      }
    }
  );

  hostActivitiesRouter.post(
    '/:id/participants/:participantId/revoke',
    requireOrgRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ params: participantIdSchema, body: hostParticipantRevokeSchema }),
    async (req, res, next) => {
      try {
        const tenantId = req.tenantContext!.tenantId;
        const { id, participantId } = req.params as z.infer<typeof participantIdSchema>;
        const body = req.body as z.infer<typeof hostParticipantRevokeSchema>;

        await revokeActivityParticipantAsHost({
          tenantId,
          activityId: id,
          participantId,
          hostUserId: req.auth!.userId,
          hostNote: resolveHostNote(body) ?? '',
        });

        await createAuditLog({
          actorId: req.auth!.userId,
          action: 'participant.revoked',
          entityType: 'activity_participant',
          entityId: participantId,
          tenantId,
        });

        res.json({ message: 'Participant removed.' });
      } catch (error) {
        next(error);
      }
    }
  );

  hostActivitiesRouter.post(
    '/:id/participants/:participantId/rating',
    requireOrgRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ params: participantIdSchema, body: hostParticipantRatingSchema }),
    async (req, res, next) => {
      try {
        const tenantId = req.tenantContext!.tenantId;
        const { id, participantId } = req.params as z.infer<typeof participantIdSchema>;
        const body = req.body as z.infer<typeof hostParticipantRatingSchema>;

        const updated = await rateActivityParticipantAsHost({
          tenantId,
          activityId: id,
          participantId,
          hostUserId: req.auth!.userId,
          score: body.score,
          comment: body.comment,
        });

        await createAuditLog({
          actorId: req.auth!.userId,
          action: 'participant.rated',
          entityType: 'activity_participant',
          entityId: participantId,
          tenantId,
        });

        res.json({
          data: {
            score: updated.hostRatingScore,
            comment: updated.hostRatingComment,
            ratedAt: updated.hostRatedAt?.toISOString() ?? null,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
};
