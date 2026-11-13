import type {
  ActivityDTO,
  MemberGoalDTO,
  MyActivityDTO,
  ParticipantIntentDTO,
  WishlistItemDTO,
} from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../api/types';
import { partitionParticipantIntentsForPlanHub } from '../member-plan/participantIntentPlan';
import { buildUpcomingPlanRows } from '../utils/activityHubSections';
import { aggregateMemberGoals } from '../utils/memberGoalsAggregate';

const todayStart = () => new Date(new Date().toDateString());

/** Upcoming hosted outings + open seeking posts (matches Plan hosting list). */
export const countPlanHostingUpcoming = (
  activities: ActivityDTO[],
  _pendingRequests: ActivityRequestView[],
  intents: ParticipantIntentDTO[]
): number => {
  const today = todayStart();
  const hostedActivityIds = new Set(activities.map((a) => a.id));
  let count = 0;
  for (const event of activities) {
    if (event.status !== 'published') continue;
    if (new Date(event.date) < today) continue;
    count += 1;
  }
  const { upcoming } = partitionParticipantIntentsForPlanHub(intents);
  for (const intent of upcoming) {
    const activityId = intent.activityId ?? intent.seekingActivityId;
    if (activityId && hostedActivityIds.has(activityId)) continue;
    count += 1;
  }
  return count;
};

/** Confirmed + pending join requests on upcoming outings. */
export const countPlanJoinedUpcoming = (
  activities: MyActivityDTO[],
  requests: ActivityRequestView[]
): number => buildUpcomingPlanRows(activities, requests).length;

export const countPlanActiveGoals = (goals: MemberGoalDTO[]): number =>
  aggregateMemberGoals(goals).activeGoals.length;

/** Wishlist rows tied to a catalog place (map saves). */
export const countPlanSavedPlaces = (items: WishlistItemDTO[]): number =>
  items.filter((item) => Boolean(item.locationId || item.areaId)).length;
