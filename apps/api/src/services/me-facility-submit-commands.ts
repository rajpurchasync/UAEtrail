import type { FacilityKind } from '@uaetrail/shared-types';
import type { z } from 'zod';
import type { locationSubmitBodySchema } from '../domain/location-submit.js';
import { RewardAction } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { findPublishedAreaById } from '../lib/areas-store.js';
import { createAuditLog } from '../lib/audit.js';
import { createFacilityRecord } from '../lib/facilities-store.js';
import { toFacilityDto } from '../lib/facility-mappers.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import { findAuthUserById } from '../lib/auth-users-store.js';
import { notifyAdminsCatalogSubmitted } from './catalog-submit-notifications.js';
import { buildFacilitySubmitInput } from './facility-submit.js';
import { awardPoints } from './rewards.js';

type FacilitySubmitBody = z.infer<typeof locationSubmitBodySchema> & {
  facilityKind?: FacilityKind | null;
  onSiteId?: string | null;
};

export const submitMyFacility = async (userId: string, body: FacilitySubmitBody) => {
  const destinationId = body.destinationId?.trim();
  if (!destinationId) {
    throw new ApiError(400, 'destination_required', 'Choose a published destination.');
  }
  const area = await findPublishedAreaById(destinationId);
  if (!area) {
    throw new ApiError(400, 'destination_not_found', 'Choose a published destination.');
  }
  if (!body.facilityKind) {
    throw new ApiError(400, 'facility_kind_required', 'facilityKind is required.');
  }

  const facilityKind = body.facilityKind as FacilityKind;
  const facility = await createFacilityRecord(
    buildFacilitySubmitInput(
      {
        ...body,
        facilityKind,
        onSiteId: body.onSiteId ?? null,
      },
      userId
    )
  );

  await createAuditLog({
    actorId: userId,
    action: 'facility.submit',
    entityType: 'facility',
    entityId: facility.id,
  });

  const submitter = await findAuthUserById(userId);
  const submitterLabel = submitter?.profile?.displayName?.trim() || submitter?.email || 'A member';
  notifyAdminsCatalogSubmitted({
    kind: 'facility',
    entityId: facility.id,
    name: facility.name,
    catalogLabel: facility.facilityKind,
    submitterLabel,
  });

  scheduleSideEffect(
    awardPoints({
      userId,
      action: RewardAction.LOCATION_SUBMITTED,
      referenceId: facility.id,
      label: `Submitted facility: ${facility.name}`,
    }),
    'member.facility_submitted_rewards'
  );

  return toFacilityDto(facility);
};
