import type { z } from 'zod';
import type { locationSubmitBodySchema } from '../domain/location-submit.js';
import { RewardAction } from '../domain/enums.js';
import { createLocationRecord } from '../lib/activities-store.js';
import { createAuditLog } from '../lib/audit.js';
import { toLocationDto } from '../lib/mappers.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import { buildLocationCreateData } from './location-submit.js';
import { resolvePlaceSubmitDestination } from './place-submit-destination.js';
import { awardPoints } from './rewards.js';

export const submitPublishingLocation = async (input: {
  userId: string;
  tenantId: string;
  body: z.infer<typeof locationSubmitBodySchema>;
}) => {
  const { destinationId, areaLabel } = await resolvePlaceSubmitDestination(input.body);

  const created = await createLocationRecord(
    buildLocationCreateData({ ...input.body, destinationId, areaLabel }, input.userId)
  );

  await createAuditLog({
    actorId: input.userId,
    action: 'location.submit',
    entityType: 'location',
    entityId: created.id,
    tenantId: input.tenantId,
  });

  scheduleSideEffect(
    awardPoints({
      userId: input.userId,
      action: RewardAction.LOCATION_SUBMITTED,
      referenceId: created.id,
      label: `Submitted location: ${created.name}`,
    }),
    'host.location_submitted_rewards'
  );

  return toLocationDto(created);
};
