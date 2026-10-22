import type { ActivityDTO } from '@uaetrail/shared-types';
import { activitiesApi } from '../api/domains/activities';

/** Public activity list without the full API facade — used by the guest home rail. */
export const fetchApiActivities = async (
  when: 'upcoming' | 'past' = 'upcoming',
  pageSize = 100
): Promise<ActivityDTO[]> => {
  const events = await activitiesApi.getPublicActivities({ when, pageSize });
  return events.data;
};
