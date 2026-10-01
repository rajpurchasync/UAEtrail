import { buildShareText, buildShareUrl } from './share';

export type ActivityShareInput = {
  id: string;
  title: string;
  activityType: string;
  date?: string | null;
  locationName?: string | null;
};

export const activityShareInputFromActivity = (
  activity: Pick<ActivityShareInput, 'id' | 'activityType' | 'date' | 'locationName'> & {
    title?: string | null;
  }
): ActivityShareInput => ({
  id: activity.id,
  title: activity.title?.trim() || activity.locationName?.trim() || 'Outdoor plan',
  activityType: activity.activityType,
  date: activity.date,
  locationName: activity.locationName,
});

export const activitySharePath = (activityId: string) => `/activity/${activityId}`;

export const buildActivityShareDetail = (activity: ActivityShareInput): string => {
  const label = activity.title?.trim() || activity.locationName?.trim() || 'Outdoor plan';
  const when = activity.date?.trim();
  return when
    ? `${when} · ${label} — join on UAE Trail`
    : `${label} — join this ${activity.activityType} outing on UAE Trail`;
};

export const buildActivitySharePayload = (activity: ActivityShareInput) => {
  const title = activity.title?.trim() || activity.locationName?.trim() || 'Outdoor plan';
  const text = buildActivityShareDetail(activity);
  const path = activitySharePath(activity.id);
  const url = buildShareUrl(path);
  const shareBody = buildShareText(title, text);
  const messageWithUrl = `${shareBody}\n${url}`;
  return { title, text, path, url, shareBody, messageWithUrl };
};
