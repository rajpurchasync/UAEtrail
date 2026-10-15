import type { ActivityDetailTabId } from '../activityDetailTab';

/** Scroll targets on public `/activity/:id` (consumer layout — no tab panels). */
export const ACTIVITY_DETAIL_CONSUMER_ANCHOR = {
  top: 'activity-detail-consumer-top',
  participants: 'activity-detail-participants',
  meetingPoint: 'activity-detail-meeting-point',
  transport: 'activity-detail-transport',
} as const;

const TAB_TO_ANCHOR: Record<ActivityDetailTabId, string> = {
  plan: ACTIVITY_DETAIL_CONSUMER_ANCHOR.top,
  place: ACTIVITY_DETAIL_CONSUMER_ANCHOR.meetingPoint,
  buddies: ACTIVITY_DETAIL_CONSUMER_ANCHOR.participants,
  transport: ACTIVITY_DETAIL_CONSUMER_ANCHOR.transport,
};

export const activityDetailConsumerAnchorForTab = (tab: ActivityDetailTabId): string =>
  TAB_TO_ANCHOR[tab];

export const scrollActivityDetailConsumerSection = (tab: ActivityDetailTabId): void => {
  const id = activityDetailConsumerAnchorForTab(tab);
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const scrollActivityDetailMeetingPoint = (): void => {
  document
    .getElementById(ACTIVITY_DETAIL_CONSUMER_ANCHOR.meetingPoint)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
