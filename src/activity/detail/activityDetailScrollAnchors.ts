import type { ActivityDetailTabId } from '../activityDetailTab';

/** Scroll targets on public `/activity/:id` (scroll layout — no tab panels). */
export const ACTIVITY_DETAIL_SCROLL_ANCHOR = {
  top: 'activity-detail-scroll-top',
  participants: 'activity-detail-participants',
  meetingPoint: 'activity-detail-meeting-point',
  transport: 'activity-detail-transport',
} as const;

const TAB_TO_ANCHOR: Record<ActivityDetailTabId, string> = {
  plan: ACTIVITY_DETAIL_SCROLL_ANCHOR.top,
  place: ACTIVITY_DETAIL_SCROLL_ANCHOR.meetingPoint,
  buddies: ACTIVITY_DETAIL_SCROLL_ANCHOR.participants,
  transport: ACTIVITY_DETAIL_SCROLL_ANCHOR.transport,
};

export const activityDetailScrollAnchorForTab = (tab: ActivityDetailTabId): string =>
  TAB_TO_ANCHOR[tab];

export const scrollActivityDetailSection = (tab: ActivityDetailTabId): void => {
  const id = activityDetailScrollAnchorForTab(tab);
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const scrollActivityDetailMeetingPoint = (): void => {
  document
    .getElementById(ACTIVITY_DETAIL_SCROLL_ANCHOR.meetingPoint)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
