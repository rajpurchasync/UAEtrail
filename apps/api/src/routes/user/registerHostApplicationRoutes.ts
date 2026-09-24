import type { Router } from 'express';
import { z } from 'zod';
import { HostApplicationStatus } from '../../domain/enums.js';
import {
  buildHostApplicationMetadata,
  hostApplicationBodySchema,
  resolveHostApplicationDisplayName,
  resolveHostApplicationRequestedName,
  resolveHostApplicationTenantType,
} from '../../domain/host-application.js';
import { assertMinimumAge } from '../../domain/user-profile.js';
import { ApiError } from '../../lib/api-error.js';
import { findAuthUserById, updateAuthUserProfile } from '../../lib/auth-users.js';
import { parseHostDetailsFromMetadata } from '../../lib/host-display-details.js';
import {
  approveHostApplicationAndProvisionTenant,
  createHostApplicationDetailed,
  findLatestHostApplicationByApplicant,
  findLatestHostApplicationWithApplicant,
  findPendingHostApplicationByApplicant,
  updateHostApplicationMetadata,
} from '../../lib/host-applications-store.js';
import { formatE164Phone } from '../../lib/phone.js';
import { slugify } from '../../lib/slug.js';
import { findTenantByOwnerId } from '../../lib/activities-store.js';
import { listTenantsByOwnerId, tenantMatchesHostProfileType } from '../../lib/tenant-store.js';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { notifyPlatformAdmins } from '../../services/admin-notifications.js';
import { hostDetailsSchema } from './schemas.js';

export const registerHostApplicationRoutes = (router: Router): void => {
  router.patch(
    '/me/host-details',
    requireAuth,
    requireVerifiedEmail,
    validate({ body: hostDetailsSchema }),
    async (req, res, next) => {
      try {
        const userId = req.auth!.userId;
        const body = req.body as z.infer<typeof hostDetailsSchema>;
        let application = await findLatestHostApplicationByApplicant(userId);

        if (application) {
          const current = (application.metadata as Record<string, unknown> | null) ?? {};
          application = await updateHostApplicationMetadata(application.id, { ...current, ...body });
        } else {
          const tenant = await findTenantByOwnerId(userId);
          if (!tenant) {
            throw new ApiError(403, 'not_organizer', 'Only hosts can update public profile details.');
          }
          application = await createHostApplicationDetailed({
            applicantId: userId,
            requestedName: tenant.name,
            requestedSlug: tenant.slug,
            requestedType: tenant.type,
            requestedTenantId: tenant.id,
            status: HostApplicationStatus.APPROVED,
            metadata: body,
          });
        }

        const details = parseHostDetailsFromMetadata(application.metadata);
        res.json({ data: { ...details, hostDetails: details } });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/me/host-application', requireAuth, async (req, res, next) => {
    try {
      const application = await findLatestHostApplicationWithApplicant(req.auth!.userId);

      if (!application) {
        return res.json({ data: null });
      }

      res.json({
        data: {
          id: application.id,
          applicantEmail: application.applicant.email,
          applicantName: application.applicant.profile?.displayName ?? application.applicant.email,
          requestedName: application.requestedName,
          requestedType: application.requestedType,
          status: application.status,
          reviewerNote: application.reviewerNote,
          reviewedAt: application.reviewedAt?.toISOString() ?? null,
          metadata: application.metadata,
          createdAt: application.createdAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/me/host-application',
    requireAuth,
    validate({ body: hostApplicationBodySchema }),
    async (req, res, next) => {
      try {
        const userId = req.auth!.userId;
        const body = req.body as z.infer<typeof hostApplicationBodySchema>;

        if (body.hostProfileType === 'individual') {
          const applicant = await findAuthUserById(userId);
          const dateOfBirth = applicant?.profile?.dateOfBirth;
          if (!dateOfBirth) {
            throw new ApiError(
              400,
              'profile_incomplete',
              'Complete your profile with date of birth before hosting.'
            );
          }
          assertMinimumAge(dateOfBirth, 15, 'host_age_requirement_not_met');
        }

        const ownedTenants = await listTenantsByOwnerId(userId);
        if (ownedTenants.some((tenant) => tenantMatchesHostProfileType(tenant, body.hostProfileType))) {
          const label =
            body.hostProfileType === 'agency'
              ? 'agency'
              : body.hostProfileType === 'shop'
                ? 'shop'
                : 'guide';
          throw new ApiError(409, 'profile_exists', `You already have a ${label} profile on the map.`);
        }

        const phoneE164 = formatE164Phone(body.phoneCountryCode, body.phone);
        const requestedName = resolveHostApplicationRequestedName(body);
        const displayName = resolveHostApplicationDisplayName(body);
        const metadata = buildHostApplicationMetadata(body, phoneE164);

        await updateAuthUserProfile(userId, {
          displayName,
          bio: body.bio,
          phone: phoneE164,
          ...('profilePhoto' in body && body.profilePhoto ? { avatarUrl: body.profilePhoto } : {}),
        });

        let application = await findPendingHostApplicationByApplicant(userId);
        if (application) {
          await updateHostApplicationMetadata(application.id, metadata);
        } else {
          application = await createHostApplicationDetailed({
            applicantId: userId,
            requestedName,
            requestedSlug: slugify(requestedName),
            requestedType: resolveHostApplicationTenantType(body.hostProfileType),
            metadata,
          });
        }

        const provisioned = await approveHostApplicationAndProvisionTenant({
          applicationId: application.id,
          reviewerId: userId,
          reviewerNote: 'Auto-approved on host signup',
        });

        if (!provisioned) {
          throw new ApiError(500, 'host_provision_failed', 'Could not set up your host profile.');
        }

        const approvedApplication = await findLatestHostApplicationByApplicant(userId);

        const profileLabel =
          body.hostProfileType === 'agency'
            ? 'a tour agency'
            : body.hostProfileType === 'shop'
              ? 'a shop'
              : 'an individual guide';

        void notifyPlatformAdmins({
          title: 'New host joined',
          body: `${displayName} is now hosting as ${profileLabel}.`,
          meta: {
            kind: 'host_application_submitted',
            applicationId: application.id,
            path: '/admin/hosts',
          },
        });

        res.status(201).json({
          data: {
            id: application.id,
            applicantEmail: req.auth!.email,
            applicantName: displayName,
            requestedName: application.requestedName,
            requestedType: application.requestedType,
            requestedTenantId: provisioned.tenantId,
            status: HostApplicationStatus.APPROVED,
            metadata: approvedApplication?.metadata ?? application.metadata,
            createdAt: application.createdAt.toISOString(),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
};
