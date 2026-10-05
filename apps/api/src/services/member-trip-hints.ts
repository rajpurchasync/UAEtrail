import type { ExploreMapItemDTO, SocialPersonTripHintDTO, SocialPersonTripRole } from '@uaetrail/shared-types';
import { todayIso } from '../lib/explore-activity-date-filter.js';

const activityHostUserId = (item: ExploreMapItemDTO): string | null => {
  if (item.source !== 'activity') return null;
  return item.featuredPerson?.userId ?? item.activity?.hostUserId ?? null;
};

const memberIsParticipantOnActivity = (item: ExploreMapItemDTO, memberUserId: string): boolean =>
  (item.participantPreviews ?? []).some((preview) => preview.id === memberUserId);

const tripSortKey = (hint: SocialPersonTripHintDTO): string => {
  if (hint.date && /^\d{4}-\d{2}-\d{2}$/.test(hint.date)) return hint.date;
  return '9999-12-31';
};

const isUpcomingOrUndated = (date: string | null | undefined): boolean => {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return true;
  return date >= todayIso();
};

const toHint = (
  item: ExploreMapItemDTO,
  role: SocialPersonTripRole
): SocialPersonTripHintDTO => ({
  activityId: item.activity?.id ?? item.id.replace(/^activity:/, ''),
  exploreItemId: item.id,
  title: item.title ?? item.activity?.title ?? 'Outing',
  date: item.date ?? null,
  time: item.time ?? null,
  role,
});

/** Earliest visible upcoming outing per member (hosting preferred over joining at same date). */
export const buildMemberTripHintMap = (
  memberUserIds: Set<string>,
  mapItems: ExploreMapItemDTO[]
): Map<string, SocialPersonTripHintDTO> => {
  const result = new Map<string, SocialPersonTripHintDTO>();
  if (memberUserIds.size === 0) return result;

  const activities = mapItems.filter(
    (item) =>
      item.source === 'activity' &&
      item.activity &&
      item.viewerAccess?.exposure !== 'none' &&
      isUpcomingOrUndated(item.date)
  );

  for (const memberUserId of memberUserIds) {
    let hosting: SocialPersonTripHintDTO | null = null;
    let joining: SocialPersonTripHintDTO | null = null;

    for (const item of activities) {
      if (activityHostUserId(item) === memberUserId) {
        const candidate = toHint(item, 'hosting');
        if (!hosting || tripSortKey(candidate) < tripSortKey(hosting)) hosting = candidate;
      } else if (memberIsParticipantOnActivity(item, memberUserId)) {
        const candidate = toHint(item, 'joining');
        if (!joining || tripSortKey(candidate) < tripSortKey(joining)) joining = candidate;
      }
    }

    const pick = hosting ?? joining;
    if (pick) result.set(memberUserId, pick);
  }

  return result;
};
