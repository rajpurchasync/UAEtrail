import {
  isPublishedActivityStatus,
  resolveParticipationMode,
  type ActivityDTO,
} from '@uaetrail/shared-types';
import { canLinkRideshareToActivity } from '@/discovery/discoverySessionExploreLinkRideshareOffer';

export type ActivityManageCapabilityOptions = {
  /** Wire `viewerAccess.entitlements.canAddLinkedRide` — default false when omitted. */
  canAddLinkedRide?: boolean;
};

export type ActivityManageCapabilities = {
  showJoinRequests: boolean;
  showLinkRideshare: boolean;
  showGroupChat: boolean;
  kindLabel: string;
};

const kindLabel = (activity: ActivityDTO): string => {
  switch (activity.activityType) {
    case 'rideshare':
      return 'Rideshare';
    case 'hiking':
      return 'Hike';
    case 'camping':
      return 'Camp';
    case 'event':
      return 'Event';
    default:
      return 'Outing';
  }
};

/** Tenant/publisher actions available for a published activity (roster, rideshare link, crew chat). */
export const activityManageCapabilities = (
  activity: ActivityDTO,
  options?: ActivityManageCapabilityOptions
): ActivityManageCapabilities => {
  const mode = resolveParticipationMode(activity.participationMode, activity.requirements);
  const published = isPublishedActivityStatus(activity.status);
  const canAddLinkedRide = options?.canAddLinkedRide ?? false;

  return {
    showJoinRequests: mode === 'approval' && published,
    showLinkRideshare: canLinkRideshareToActivity(activity) && published && canAddLinkedRide,
    showGroupChat: published,
    kindLabel: kindLabel(activity),
  };
};
