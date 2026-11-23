import type { ActivityDTO, AvailabilityKind } from '@uaetrail/shared-types';
import {
  availabilityKindsForActivityType,
  isPublishedActivityStatus,
} from '@uaetrail/shared-types';
import { fetchExplorePeopleAvailability } from '../hooks/memberPeopleClientApi';

const primaryAvailabilityKind = (activityType: string): AvailabilityKind | undefined =>
  availabilityKindsForActivityType(activityType)[0];

/** Optional banner after host publish — members on Find crew Available, not personalized match. */
export const buildHostPublishAvailabilityNotice = async (
  activity: ActivityDTO,
  hostUserId: string
): Promise<string | null> => {
  if ((activity as { activityMode?: string | null }).activityMode === 'seeking') return null;
  const day = activity.date?.trim();
  if (!day) return null;
  const kind = primaryAvailabilityKind(activity.activityType);

  try {
    const { people } = await fetchExplorePeopleAvailability({
      from: day,
      to: day,
      kind,
    });
    const count = people.filter((person) => person.userId !== hostUserId).length;
    if (count === 0) return null;
    if (count === 1) {
      return 'Published — 1 member marked available that day (Find crew). They may get a nudge about your outing.';
    }
    return `Published — ${count} members marked available that day (Find crew). They may get a nudge about your outing.`;
  } catch {
    return null;
  }
};

export const hostPublishAvailabilityNoticeMessage = async (
  activity: ActivityDTO,
  hostUserId: string | null | undefined
): Promise<string | null> => {
  if (!hostUserId) return null;
  const published = isPublishedActivityStatus(activity.status)
    ? activity
    : { ...activity, status: 'published' as const };
  return buildHostPublishAvailabilityNotice(published, hostUserId);
};
