import type { ActivityDTO } from '@uaetrail/shared-types';
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
  if (rideshare.activityType !== 'carpool') {
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
    linkedCarpoolActivityId: rideshareActivityId,
  });
};

/** Parent plans that may spawn or link FLOW-04 rideshares (peek + post-publish when enabled). */
export const canLinkCarpoolToActivity = (activity: ActivityDTO | null | undefined): boolean => {
  if (!activity) return false;
  if (activity.activityType === 'carpool') return false;
  return (
    activity.activityType === 'hiking' ||
    activity.activityType === 'camping' ||
    activity.activityType === 'event'
  );
};
