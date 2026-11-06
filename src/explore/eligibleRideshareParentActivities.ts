import type { ActivityDTO } from '@uaetrail/shared-types';
import { isUpcomingActivityDate } from '../utils/activityDates';
import { canLinkRideshareToActivity } from './linkActivityRideshareOffer';

export type RideshareParentRelation = 'joined' | 'hosting';

export type RideshareParentCandidate = {
  id: string;
  title: string;
  activityType: string;
  date: string;
  locationName: string | null;
  relation: RideshareParentRelation;
};

const parentTitle = (activity: Pick<ActivityDTO, 'title' | 'locationName'>): string =>
  activity.title?.trim() || activity.locationName?.trim() || 'Outdoor plan';

const isEligibleParent = (activity: ActivityDTO, excludeId?: string): boolean => {
  if (excludeId && activity.id === excludeId) return false;
  if (activity.status !== 'published') return false;
  return canLinkRideshareToActivity(activity);
};

const toCandidate = (activity: ActivityDTO, relation: RideshareParentRelation): RideshareParentCandidate => ({
  id: activity.id,
  title: parentTitle(activity),
  activityType: activity.activityType,
  date: activity.date,
  locationName: activity.locationName?.trim() || null,
  relation,
});

/** Outings a member may attach a self-hosted ride to — joined or tenant-hosted (admin/guide). */
export const mergeEligibleRideshareParents = (input: {
  joined: ActivityDTO[];
  hosted: ActivityDTO[];
  excludeActivityId?: string;
}): RideshareParentCandidate[] => {
  const hostedEligible = input.hosted.filter((activity) => isEligibleParent(activity, input.excludeActivityId));
  const hostedIds = new Set(hostedEligible.map((activity) => activity.id));
  const joinedEligible = input.joined.filter(
    (activity) => isEligibleParent(activity, input.excludeActivityId) && !hostedIds.has(activity.id)
  );

  const merged = [
    ...hostedEligible.map((activity) => toCandidate(activity, 'hosting')),
    ...joinedEligible.map((activity) => toCandidate(activity, 'joined')),
  ];

  const upcoming = merged.filter((row) => isUpcomingActivityDate(row.date));
  const pool = upcoming.length > 0 ? upcoming : merged;
  const upcomingFirst = upcoming.length > 0;

  return [...pool].sort((a, b) => {
    const delta = new Date(a.date).getTime() - new Date(b.date).getTime();
    return upcomingFirst ? delta : -delta;
  });
};

export type SelfRideshareCandidate = {
  id: string;
  title: string;
  date: string;
  locationName: string | null;
};

/** Published rides this host already created and can attach to a parent outing. */
export const filterEligibleSelfRideshares = (
  hosted: ActivityDTO[],
  parentActivityId: string
): SelfRideshareCandidate[] => {
  const rows = hosted.filter((activity) => {
    if (activity.id === parentActivityId) return false;
    if (activity.activityType !== 'rideshare') return false;
    if (activity.status !== 'published') return false;
    const linked = activity.linkedActivityId?.trim();
    return !linked || linked === parentActivityId;
  });
  const upcoming = rows.filter((activity) => isUpcomingActivityDate(activity.date));
  const pool = upcoming.length > 0 ? upcoming : rows;
  const upcomingFirst = upcoming.length > 0;
  return [...pool]
    .sort((a, b) => {
      const delta = new Date(a.date).getTime() - new Date(b.date).getTime();
      return upcomingFirst ? delta : -delta;
    })
    .map((activity) => ({
      id: activity.id,
      title: parentTitle(activity),
      date: activity.date,
      locationName: activity.locationName?.trim() || null,
    }));
};
