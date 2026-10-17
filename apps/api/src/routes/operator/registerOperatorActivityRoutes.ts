import type { Router } from 'express';
import { Router as createRouter } from 'express';
import type { z } from 'zod';
import { mountActivityRoutes } from '../../lib/activity-routes.js';
import {
  operatorTenantActivityCreateSchema,
  operatorTenantActivityPatchSchema,
} from '../../lib/operator-tenant-activity-schemas.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { requireOrgRole } from '../../middleware/tenant.js';
import { ORG_ACTIVITY_EDIT_ROLES, ORG_ACTIVITY_PUBLISH_ROLES } from '../../lib/org-permissions.js';
import { validate } from '../../middleware/validate.js';
import {
  createOperatorTenantActivity,
  deleteOrCancelOperatorTenantActivity,
  duplicateOperatorTenantActivity,
  publishOperatorTenantActivity,
  updateOperatorTenantActivity,
} from '../../services/operator-tenant-activity-commands.js';
import {
  listOperatorTenantActivitiesPage,
  listOperatorTenantActivityHistoryPage,
} from '../../services/operator-tenant-activity-read.js';
import { registerOperatorActivityRequestRoutes } from './registerOperatorActivityRequestRoutes.js';
import { registerOperatorTeamRoutes } from './registerOperatorTeamRoutes.js';
import { registerOperatorActivityParticipantRoutes } from './registerOperatorActivityParticipantRoutes.js';
import { idParamSchema } from './operator-route-schemas.js';

/** Publishing workspace **activity** CRUD, publish, and history (`/publishing/activities/*`). */
export const registerOperatorActivityRoutes = (operatorRouter: Router): void => {
  const hostActivitiesRouter = createRouter();

  hostActivitiesRouter.get('/', async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const pg = paginationSchema.parse(req.query);
      const { items, total } = await listOperatorTenantActivitiesPage({
        tenantId,
        page: pg.page,
        pageSize: pg.pageSize,
      });
      res.json(paginatedResponse(items, total, pg));
    } catch (error) {
      next(error);
    }
  });

  hostActivitiesRouter.post(
    '/',
    requireOrgRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ body: operatorTenantActivityCreateSchema }),
    async (req, res, next) => {
      try {
        const result = await createOperatorTenantActivity({
          tenantId: req.tenantContext!.tenantId,
          actorId: req.auth!.userId,
          platformAdmin: Boolean(req.tenantContext!.actingAsPlatformAdmin),
          body: req.body,
        });
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  hostActivitiesRouter.patch(
    '/:id',
    requireOrgRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ params: idParamSchema, body: operatorTenantActivityPatchSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const result = await updateOperatorTenantActivity({
          tenantId: req.tenantContext!.tenantId,
          actorId: req.auth!.userId,
          platformAdmin: Boolean(req.tenantContext!.actingAsPlatformAdmin),
          activityId: id,
          body: req.body,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  hostActivitiesRouter.delete(
    '/:id',
    requireOrgRole(ORG_ACTIVITY_PUBLISH_ROLES),
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        await deleteOrCancelOperatorTenantActivity({
          tenantId: req.tenantContext!.tenantId,
          actorId: req.auth!.userId,
          activityId: id,
        });
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );

  hostActivitiesRouter.post(
    '/:id/duplicate',
    requireOrgRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const result = await duplicateOperatorTenantActivity({
          tenantId: req.tenantContext!.tenantId,
          actorId: req.auth!.userId,
          activityId: id,
        });
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  hostActivitiesRouter.post(
    '/:id/publish',
    requireOrgRole(ORG_ACTIVITY_PUBLISH_ROLES),
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const result = await publishOperatorTenantActivity({
          tenantId: req.tenantContext!.tenantId,
          actorId: req.auth!.userId,
          platformAdmin: Boolean(req.tenantContext!.actingAsPlatformAdmin),
          activityId: id,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  registerOperatorActivityRequestRoutes(operatorRouter);
  registerOperatorTeamRoutes(operatorRouter);
  registerOperatorActivityParticipantRoutes(hostActivitiesRouter);

  hostActivitiesRouter.get('/history', async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const pg = paginationSchema.parse(req.query);
      const { items, total } = await listOperatorTenantActivityHistoryPage({
        tenantId,
        page: pg.page,
        pageSize: pg.pageSize,
      });
      res.json(paginatedResponse(items, total, pg));
    } catch (error) {
      next(error);
    }
  });

  mountActivityRoutes(operatorRouter, hostActivitiesRouter);
};
