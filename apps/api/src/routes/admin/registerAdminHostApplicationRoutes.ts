import { HostApplicationStatus } from '../../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { createAuditLog } from '../../lib/audit.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import { shopPublicPath } from '@uaetrail/shared-types';
import {
  approveHostApplicationAndProvisionTenant,
  countHostApplications,
  findHostApplicationById,
  listHostApplicationsDetailed,
  markHostApplicationRejected,
} from '../../lib/host-applications-store.js';
import { PRO_MEMBERSHIP_PATH } from '../../lib/member-routes.js';
import { notifyUserAdminAction } from '../../services/admin-notifications.js';

const idParamSchema = z.object({ id: z.string().min(1) });

const applicationPatchSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewerNote: z.string().max(300).optional(),
});

/** Platform admin review of Pro / host / shop applications. */
export const registerAdminHostApplicationRoutes = (router: Router): void => {
  router.get('/host-applications', async (req, res, next) => {
    try {
      const pg = paginationSchema.parse(req.query);
      const [applications, total] = await Promise.all([
        listHostApplicationsDetailed({
          skip: (pg.page - 1) * pg.pageSize,
          take: pg.pageSize,
        }),
        countHostApplications(),
      ]);

      res.json(
        paginatedResponse(
          applications.map((item) => ({
            id: item.id,
            applicantId: item.applicantId,
            applicantEmail: item.applicant.email,
            applicantName: item.applicant.profile?.displayName ?? item.applicant.email,
            requestedName: item.requestedName,
            requestedType: item.requestedType.toLowerCase(),
            requestedSlug: item.requestedSlug,
            requestedTenantId: item.requestedTenantId,
            status: item.status.toLowerCase(),
            reviewerNote: item.reviewerNote,
            reviewedAt: item.reviewedAt,
            metadata: item.metadata,
            createdAt: item.createdAt,
          })),
          total,
          pg
        )
      );
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    '/host-applications/:id',
    validate({ params: idParamSchema, body: applicationPatchSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { status, reviewerNote } = req.body as z.infer<typeof applicationPatchSchema>;

        const application = await findHostApplicationById(id);
        if (!application) {
          throw new ApiError(404, 'application_not_found', 'Host application was not found.');
        }
        if (application.status !== HostApplicationStatus.PENDING) {
          throw new ApiError(400, 'application_finalized', 'Application is already finalized.');
        }

        if (status === 'approved') {
          const appMeta = (application.metadata as Record<string, unknown> | null) ?? {};
          const hostProfileType = String(appMeta.hostProfileType ?? '').toLowerCase();
          const isShop = hostProfileType === 'shop';

          await approveHostApplicationAndProvisionTenant({
            applicationId: application.id,
            reviewerId: req.auth!.userId,
            reviewerNote,
          });

          const approvedPath = isShop
            ? shopPublicPath({ slug: application.requestedSlug })
            : PRO_MEMBERSHIP_PATH;
          const approvedTitle = isShop ? 'Shop approved' : 'Host application approved';
          const approvedBody = isShop
            ? reviewerNote
              ? `"${application.requestedName}" is on Explore. Note from reviewer: ${reviewerNote}`
              : `"${application.requestedName}" is approved. Explorers can find your shop on the map.`
            : reviewerNote
              ? `You can now post activities. Note from reviewer: ${reviewerNote}`
              : 'Your host profile was approved. You can now post activities and welcome participants.';

          await notifyUserAdminAction({
            userId: application.applicantId,
            title: approvedTitle,
            body: approvedBody,
            reason: reviewerNote,
            meta: {
              kind: 'host_application_approved',
              applicationId: application.id,
              path: approvedPath,
            },
          });
        } else {
          await markHostApplicationRejected({
            id: application.id,
            reviewerId: req.auth!.userId,
            reviewerNote,
          });
          await notifyUserAdminAction({
            userId: application.applicantId,
            title: 'Host application not approved',
            body: reviewerNote
              ? reviewerNote
              : 'Your host application was not approved at this time. You can update your profile and apply again.',
            reason: reviewerNote,
            meta: {
              kind: 'host_application_rejected',
              applicationId: application.id,
              path: PRO_MEMBERSHIP_PATH,
            },
          });
        }

        await createAuditLog({
          actorId: req.auth!.userId,
          action: `host_application.${status}`,
          entityType: 'host_application',
          entityId: id,
        });

        res.json({ message: `Application ${status}.` });
      } catch (error) {
        next(error);
      }
    }
  );
};
