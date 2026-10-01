import type { ActivityDTO, ExploreMapItemDTO, ParticipantIntentDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

/** Parse `/activity/:id` or a bare UUID from user paste. */
export const parseActivityIdFromShareInput = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed;
  }
  try {
    const url = trimmed.includes('://') ? new URL(trimmed) : new URL(trimmed, 'https://uaetrail.com');
    const match = url.pathname.match(/\/activity\/([^/?#]+)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
};

const assertRideshareForLink = (rideshare: ActivityDTO, tenantId: string, parentId: string): void => {
  if (rideshare.activityType !== 'rideshare') {
    throw new Error('That link must be a published rideshare activity.');
  }
  if (rideshare.tenantId !== tenantId) {
    throw new Error('You can only link rides you host under this organization.');
  }
  if (rideshare.status !== 'published') {
    throw new Error('Publish the rideshare first, then paste its link here.');
  }
  if (rideshare.linkedActivityId && rideshare.linkedActivityId !== parentId) {
    throw new Error('That rideshare is already linked to another plan.');
  }
  if (rideshare.id === parentId) {
    throw new Error('Cannot link a plan to itself.');
  }
};

/** Link a standalone rideshare activity to a parent hike/camp/event/activity. */
export const linkParentToRideshareActivity = async (
  tenantId: string,
  parentActivityId: string,
  rideshareActivityId: string
): Promise<void> => {
  const detail = await api.getPublicActivityDetail(rideshareActivityId);
  const rideshare = detail.data as ActivityDTO;
  assertRideshareForLink(rideshare, tenantId, parentActivityId);
  if (rideshare.linkedActivityId === parentActivityId) {
    return;
  }

  await api.updateOrganisationActivity(tenantId, rideshareActivityId, {
    linkedActivityId: parentActivityId,
  });
  await api.updateOrganisationActivity(tenantId, parentActivityId, {
    linkedRideshareActivityId: rideshareActivityId,
  });
};

/** Parent plans that may spawn or link FLOW-04 rideshares (peek + post-publish when enabled). */
export const canLinkRideshareToActivity = (activity: ActivityDTO | null | undefined): boolean => {
  if (!activity) return false;
  if (activity.activityType === 'rideshare') return false;
  return (
    activity.activityType === 'hiking' ||
    activity.activityType === 'camping' ||
    activity.activityType === 'event'
  );
};

/** Own-demand peek — offer a rideshare alongside a looking-for pin (not rideshare demands). */
export const canOfferRideshareForDemandItem = (item: ExploreMapItemDTO | null | undefined): boolean => {
  if (!item || item.source !== 'demand') return false;
  if (item.convertedActivityId) return false;
  if (item.kind === 'rideshare') return false;
  return item.kind === 'hiking' || item.kind === 'camping' || item.kind === 'event';
};

/** Trips → My plans manage sheet — same rules as map owner peek. */
export const canOfferRideshareForParticipantIntent = (
  intent: ParticipantIntentDTO | null | undefined
): boolean => {
  if (!intent || intent.status !== 'active') return false;
  if (intent.convertedActivityId) return false;
  if (intent.kind === 'rideshare') return false;
  return intent.kind === 'hiking' || intent.kind === 'camping' || intent.kind === 'event';
};
