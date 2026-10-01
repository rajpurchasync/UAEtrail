import type { ActivityDTO } from '@uaetrail/shared-types';
import type { UpcomingPlanRow } from '../../utils/activityHubSections';

/** Max cards in the Upcoming horizontal rail on the Trips tab (UI only). */
export const UPCOMING_HUB_HIGHLIGHT_MAX = 5;

export type UpcomingHubHighlight =
  | { kind: 'joined'; date: string; row: UpcomingPlanRow }
  | { kind: 'hosted'; date: string; activity: ActivityDTO };

export const buildUpcomingHubHighlights = (
  joinedRows: UpcomingPlanRow[],
  hostedActivities: ActivityDTO[],
  max = UPCOMING_HUB_HIGHLIGHT_MAX
): UpcomingHubHighlight[] => {
  const items: UpcomingHubHighlight[] = [
    ...joinedRows.map((row) => ({ kind: 'joined' as const, date: row.date, row })),
    ...hostedActivities.map((activity) => ({
      kind: 'hosted' as const,
      date: activity.date,
      activity,
    })),
  ];

  return items
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, max);
};
