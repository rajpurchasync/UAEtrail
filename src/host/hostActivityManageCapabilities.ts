import type { ActivityDTO } from '@uaetrail/shared-types';
import { resolveParticipationMode } from '@uaetrail/shared-types';
import { canLinkRideshareToActivity } from '../explore/linkActivityRideshareOffer';

export type HostManageCapabilityOptions = {
  /** Wire `viewerAccess.entitlements.canAddLinkedRide` — default false when omitted. */
  canAddLinkedRide?: boolean;
};

export type HostManageCapabilities = {
  /** Host approval join requests */
  showJoinRequests: boolean;
  /** FLOW-04 link / create rideshare on parent hike/camp/event */
  showLinkRideshare: boolean;
  /** Activity group chat */
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

/** What hosts can manage per published activity type (organize / host publish). */
export const hostActivityManageCapabilities = (
  activity: ActivityDTO,
  options?: HostManageCapabilityOptions
): HostManageCapabilities => {
  const mode = resolveParticipationMode(activity.participationMode, activity.requirements);
  const published = activity.status === 'published';
  const canAddLinkedRide = options?.canAddLinkedRide ?? false;

  return {
    showJoinRequests: mode === 'approval' && published,
    showLinkRideshare: canLinkRideshareToActivity(activity) && published && canAddLinkedRide,
    showGroupChat: published,
    kindLabel: kindLabel(activity),
  };
};
