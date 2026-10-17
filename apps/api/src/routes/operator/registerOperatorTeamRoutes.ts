import type { Router } from 'express';
import { z } from 'zod';
import { ORG_TEAM_MANAGE_ROLES } from '../../lib/org-permissions.js';
import { requireOrgRole } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import {
  addOperatorTeamMember,
  patchOperatorTeamMember,
  removeOperatorTeamMember,
} from '../../services/operator-team-commands.js';
import { listOperatorTeamMembers } from '../../services/operator-team-read.js';
import {
  membershipIdSchema,
  teamCreateSchema,
  teamPatchSchema,
} from './operator-route-schemas.js';

export const registerOperatorTeamRoutes = (operatorRouter: Router): void => {
  operatorRouter.get('/team', async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const data = await listOperatorTeamMembers(tenantId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  operatorRouter.post(
    '/team',
    requireOrgRole(ORG_TEAM_MANAGE_ROLES),
    validate({ body: teamCreateSchema }),
    async (req, res, next) => {
      try {
        const tenantId = req.tenantContext!.tenantId;
        const body = req.body as z.infer<typeof teamCreateSchema>;
        const data = await addOperatorTeamMember(tenantId, req.auth!.userId, body);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  operatorRouter.patch(
    '/team/:membershipId',
    requireOrgRole(ORG_TEAM_MANAGE_ROLES),
    validate({ params: membershipIdSchema, body: teamPatchSchema }),
    async (req, res, next) => {
      try {
        const { membershipId } = req.params as z.infer<typeof membershipIdSchema>;
        const body = req.body as z.infer<typeof teamPatchSchema>;
        const tenantId = req.tenantContext!.tenantId;
        const data = await patchOperatorTeamMember(tenantId, req.auth!.userId, membershipId, body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  operatorRouter.delete(
    '/team/:membershipId',
    requireOrgRole(ORG_TEAM_MANAGE_ROLES),
    validate({ params: membershipIdSchema }),
    async (req, res, next) => {
      try {
        const { membershipId } = req.params as z.infer<typeof membershipIdSchema>;
        const tenantId = req.tenantContext!.tenantId;
        const data = await removeOperatorTeamMember(tenantId, req.auth!.userId, membershipId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
