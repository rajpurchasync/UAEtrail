import type { Router } from 'express';
import { z } from 'zod';
import { ORG_TEAM_MANAGE_ROLES } from '../../lib/org-permissions.js';
import { requireOrgRole } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import {
  addPublishingTeamMember,
  patchPublishingTeamMember,
  removePublishingTeamMember,
} from '../../services/publishing-team-commands.js';
import { listPublishingTeamMembers } from '../../services/publishing-team-read.js';
import {
  membershipIdSchema,
  teamCreateSchema,
  teamPatchSchema,
} from './publishing-route-schemas.js';

export const registerPublishingTeamRoutes = (publishingRouter: Router): void => {
  publishingRouter.get('/team', async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const data = await listPublishingTeamMembers(tenantId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  publishingRouter.post(
    '/team',
    requireOrgRole(ORG_TEAM_MANAGE_ROLES),
    validate({ body: teamCreateSchema }),
    async (req, res, next) => {
      try {
        const tenantId = req.tenantContext!.tenantId;
        const body = req.body as z.infer<typeof teamCreateSchema>;
        const data = await addPublishingTeamMember(tenantId, req.auth!.userId, body);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  publishingRouter.patch(
    '/team/:membershipId',
    requireOrgRole(ORG_TEAM_MANAGE_ROLES),
    validate({ params: membershipIdSchema, body: teamPatchSchema }),
    async (req, res, next) => {
      try {
        const { membershipId } = req.params as z.infer<typeof membershipIdSchema>;
        const body = req.body as z.infer<typeof teamPatchSchema>;
        const tenantId = req.tenantContext!.tenantId;
        const data = await patchPublishingTeamMember(tenantId, req.auth!.userId, membershipId, body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  publishingRouter.delete(
    '/team/:membershipId',
    requireOrgRole(ORG_TEAM_MANAGE_ROLES),
    validate({ params: membershipIdSchema }),
    async (req, res, next) => {
      try {
        const { membershipId } = req.params as z.infer<typeof membershipIdSchema>;
        const tenantId = req.tenantContext!.tenantId;
        const data = await removePublishingTeamMember(tenantId, req.auth!.userId, membershipId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
