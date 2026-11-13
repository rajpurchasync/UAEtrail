import type { ActivityDetailDTO } from '@uaetrail/shared-types';

export type ActivityLinkagePlanSummary = {
  id: string;
  title: string;
  activityType?: string | null;
  description?: string | null;
  date?: string | null;
  time?: string | null;
  endDate?: string | null;
  endTime?: string | null;
};

export const resolveActivityLinkedParentSummary = (
  activity: Pick<ActivityDetailDTO, 'linkedParentActivity' | 'linkedActivityId'>
): ActivityLinkagePlanSummary | null => {
  const embedded = activity.linkedParentActivity;
  if (embedded?.id?.trim()) {
    return embedded;
  }
  const id = activity.linkedActivityId?.trim();
  if (!id) return null;
  return { id, title: 'Linked group outing', activityType: null };
};

export const resolveActivityLinkedRideshareSummary = (
  activity: Pick<ActivityDetailDTO, 'linkedRideshare' | 'linkedRideshareActivityId'>
): ActivityLinkagePlanSummary | null => {
  const embedded = activity.linkedRideshare;
  if (embedded?.id?.trim()) {
    return {
      id: embedded.id,
      title: embedded.title?.trim() || embedded.locationName?.trim() || 'Rideshare',
      activityType: embedded.activityType ?? 'rideshare',
      description: embedded.description ?? null,
      date: embedded.date ?? null,
      time: embedded.time ?? null,
    };
  }
  const id = activity.linkedRideshareActivityId?.trim();
  if (!id) return null;
  return { id, title: 'Linked rideshare', activityType: 'rideshare' };
};
