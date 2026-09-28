import type { ActivityDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

const CARPOOL_OFFER_DETAILS =
  'Host offers carpool — coordinate seats in activity chat after joining.';

/** Enable optional carpool on a published hiking / camping / event activity. */
export const linkActivityCarpoolOffer = async (
  tenantId: string,
  activity: ActivityDTO
): Promise<ActivityDTO> => {
  const seats = Math.max(1, activity.slotsTotal ?? 4);
  const res = await api.updateOrganisationActivity(tenantId, activity.id, {
    carPoolEnabled: true,
    carPoolFree: true,
    carPoolSeats: seats,
    carPoolDetails: CARPOOL_OFFER_DETAILS,
  });
  return res.data;
};

export const canLinkCarpoolToActivity = (activity: ActivityDTO | null | undefined): boolean => {
  if (!activity) return false;
  if (activity.activityType === 'carpool') return false;
  if (activity.carPoolEnabled) return false;
  return activity.activityType === 'hiking' || activity.activityType === 'camping' || activity.activityType === 'event';
};
