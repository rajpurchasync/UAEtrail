import { shopPublicPath } from '@uaetrail/shared-types';
import { HostApplicationStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { createAuditLog } from '../lib/audit.js';
import {
  approveHostApplicationAndProvisionTenant,
  findHostApplicationById,
  markHostApplicationRejected,
} from '../lib/host-applications-store.js';
import { PRO_MEMBERSHIP_PATH } from '../lib/member-routes.js';
import { notifyUserAdminAction } from './admin-notifications.js';

export const reviewAdminHostApplication = async (input: {
  applicationId: string;
  reviewerId: string;
  status: 'approved' | 'rejected';
  reviewerNote?: string;
}) => {
  const application = await findHostApplicationById(input.applicationId);
  if (!application) {
    throw new ApiError(404, 'application_not_found', 'Host application was not found.');
  }
  if (application.status !== HostApplicationStatus.PENDING) {
    throw new ApiError(400, 'application_finalized', 'Application is already finalized.');
  }

  if (input.status === 'approved') {
    const appMeta = (application.metadata as Record<string, unknown> | null) ?? {};
    const hostProfileType = String(appMeta.hostProfileType ?? '').toLowerCase();
    const isShop = hostProfileType === 'shop';

    await approveHostApplicationAndProvisionTenant({
      applicationId: application.id,
      reviewerId: input.reviewerId,
      reviewerNote: input.reviewerNote,
    });

    const approvedPath = isShop
      ? shopPublicPath({ slug: application.requestedSlug })
      : PRO_MEMBERSHIP_PATH;
    const approvedTitle = isShop ? 'Shop approved' : 'Host application approved';
    const approvedBody = isShop
      ? input.reviewerNote
        ? `"${application.requestedName}" is on Explore. Note from reviewer: ${input.reviewerNote}`
        : `"${application.requestedName}" is approved. Explorers can find your shop on the map.`
      : input.reviewerNote
        ? `You can now post activities. Note from reviewer: ${input.reviewerNote}`
        : 'Your host profile was approved. You can now post activities and welcome participants.';

    await notifyUserAdminAction({
      userId: application.applicantId,
      title: approvedTitle,
      body: approvedBody,
      reason: input.reviewerNote,
      meta: {
        kind: 'host_application_approved',
        applicationId: application.id,
        path: approvedPath,
      },
    });
  } else {
    await markHostApplicationRejected({
      id: application.id,
      reviewerId: input.reviewerId,
      reviewerNote: input.reviewerNote,
    });
    await notifyUserAdminAction({
      userId: application.applicantId,
      title: 'Host application not approved',
      body: input.reviewerNote
        ? input.reviewerNote
        : 'Your host application was not approved at this time. You can update your profile and apply again.',
      reason: input.reviewerNote,
      meta: {
        kind: 'host_application_rejected',
        applicationId: application.id,
        path: PRO_MEMBERSHIP_PATH,
      },
    });
  }

  await createAuditLog({
    actorId: input.reviewerId,
    action: `host_application.${input.status}`,
    entityType: 'host_application',
    entityId: input.applicationId,
  });

  return { message: `Application ${input.status}.` };
};
