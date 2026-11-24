import type { z } from 'zod';
import type { locationSubmitBodySchema } from '../domain/location-submit.js';
import { RewardAction } from '../domain/enums.js';
import { fromPrismaActivityType } from '../domain/activity-type.js';
import { createLocationRecord } from '../lib/activities-store.js';
import { createAuditLog } from '../lib/audit.js';
import { toLocationDto } from '../lib/mappers.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import { findAuthUserById } from '../lib/auth-users-store.js';
import { notifyAdminsCatalogSubmitted } from './catalog-submit-notifications.js';
import { resolvePlaceSubmitDestination } from './place-submit-area.js';
import { buildPlaceSubmitPayload } from './place-submit.js';
import { awardPoints } from './rewards.js';

export const submitMyPlace = async (
  userId: string,
  body: z.infer<typeof locationSubmitBodySchema>
) => {
  const { destinationId, areaLabel } = await resolvePlaceSubmitDestination(body);

  const created = await createLocationRecord(
    buildPlaceSubmitPayload({ ...body, destinationId, areaLabel }, userId)
  );

  await createAuditLog({
    actorId: userId,
    action: 'place.submit',
    entityType: 'place',
    entityId: created.id,
  });
  await createAuditLog({
    actorId: userId,
    action: 'location.submit',
    entityType: 'location',
    entityId: created.id,
  });

  scheduleSideEffect(
    awardPoints({
      userId,
      action: RewardAction.LOCATION_SUBMITTED,
      referenceId: created.id,
      label: `Submitted place: ${created.name}`,
    }),
    'member.place_submitted_rewards'
  );

  const submitter = await findAuthUserById(userId);
  const submitterLabel = submitter?.profile?.displayName?.trim() || submitter?.email || 'A member';
  notifyAdminsCatalogSubmitted({
    kind: 'place',
    entityId: created.id,
    name: created.name,
    catalogLabel: fromPrismaActivityType(created.activityType),
    submitterLabel,
  });

  return toLocationDto(created);
};
