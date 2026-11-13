import type { Router } from 'express';
import { Router as createRouter } from 'express';
import type { z } from 'zod';
import { mountActivityRoutes } from '../../lib/activity-routes.js';
import {
  publishingTenantActivityCreateSchema,
  publishingTenantActivityPatchSchema,
} from '../../lib/publishing-tenant-activity-schemas.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { publishingTenantActivitiesListQuerySchema } from '../../lib/publishing-tenant-activities-list-query.js';
import { requireOrgRole } from '../../middleware/tenant.js';
import { ORG_ACTIVITY_EDIT_ROLES, ORG_ACTIVITY_PUBLISH_ROLES } from '../../lib/org-permissions.js';
import { validate } from '../../middleware/validate.js';
import {
  createPublishingTenantActivity,
  deleteOrCancelPublishingTenantActivity,
  duplicatePublishingTenantActivity,
  publishPublishingTenantActivity,
  resumePublishingTenantActivity,
  suspendPublishingTenantActivity,
  updatePublishingTenantActivity,
} from '../../services/publishing-tenant-activity-commands.js';
import {
  listPublishingTenantActivitiesPage,
  listPublishingTenantActivityHistoryPage,
} from '../../services/publishing-tenant-activity-read.js';
import { registerPublishingActivityRequestRoutes } from './registerPublishingActivityRequestRoutes.js';
import { registerPublishingTeamRoutes } from './registerPublishingTeamRoutes.js';
import { registerPublishingActivityParticipantRoutes } from './registerPublishingActivityParticipantRoutes.js';
import { registerPublishingActivityGuideRoutes } from './registerPublishingActivityGuideRoutes.js';
import { idParamSchema } from './publishing-route-schemas.js';

/** Publishing workspace **activity** CRUD, publish, and history (`/publishing/activities/*`). */
export const registerPublishingActivityRoutes = (publishingRouter: Router): void => {
  const hostActivitiesRouter = createRouter();

  hostActivitiesRouter.get('/', async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const query = publishingTenantActivitiesListQuerySchema.parse(req.query);
      const { items, total } = await listPublishingTenantActivitiesPage({
        tenantId,
        page: query.page,
        pageSize: query.pageSize,
        listQuery: query,
      });
      res.json(paginatedResponse(items, total, query));
    } catch (error) {
      next(error);
    }
  });

  hostActivitiesRouter.post(
    '/',
    requireOrgRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ body: publishingTenantActivityCreateSchema }),
    async (req, res, next) => {
      try {
        const result = await createPublishingTenantActivity({
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
    validate({ params: idParamSchema, body: publishingTenantActivityPatchSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const result = await updatePublishingTenantActivity({
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
        await deleteOrCancelPublishingTenantActivity({
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
        const result = await duplicatePublishingTenantActivity({
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
        const result = await publishPublishingTenantActivity({
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

  hostActivitiesRouter.post(
    '/:id/suspend',
    requireOrgRole(ORG_ACTIVITY_PUBLISH_ROLES),
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const result = await suspendPublishingTenantActivity({
          tenantId: req.tenantContext!.tenantId,
          actorId: req.auth!.userId,
          activityId: id,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  hostActivitiesRouter.post(
    '/:id/resume',
    requireOrgRole(ORG_ACTIVITY_PUBLISH_ROLES),
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const result = await resumePublishingTenantActivity({
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

  registerPublishingActivityRequestRoutes(publishingRouter);
  registerPublishingTeamRoutes(publishingRouter);
  registerPublishingActivityParticipantRoutes(hostActivitiesRouter);
  registerPublishingActivityGuideRoutes(hostActivitiesRouter);

  hostActivitiesRouter.get('/history', async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const pg = paginationSchema.parse(req.query);
      const { items, total } = await listPublishingTenantActivityHistoryPage({
        tenantId,
        page: pg.page,
        pageSize: pg.pageSize,
      });
      res.json(paginatedResponse(items, total, pg));
    } catch (error) {
      next(error);
    }
  });

  mountActivityRoutes(publishingRouter, hostActivitiesRouter);
};
