import { notifyPlatformAdmins } from './admin-notifications.js';

const ADMIN_USERS_PATH = '/admin/users';
const ADMIN_ACTIVITIES_PATH = '/admin/activities';
const ADMIN_PLACES_PATH = '/admin/places';

export const notifyAdminsLocationSubmitted = (input: {
  locationId: string;
  name: string;
  activityType: string;
  submitterLabel: string;
}): void => {
  void notifyPlatformAdmins({
    title: 'Place submitted for review',
    body: `${input.submitterLabel} submitted "${input.name}" (${input.activityType}) — review in Places.`,
    meta: {
      kind: 'location_submitted',
      locationId: input.locationId,
      path: ADMIN_PLACES_PATH,
    },
  });
};

export const notifyAdminsMemberRegistered = (input: {
  userId: string;
  email: string;
  displayName?: string | null;
}): void => {
  const label = input.displayName?.trim() || input.email;
  void notifyPlatformAdmins({
    title: 'New member signed up',
    body: `${label} created an account.`,
    meta: {
      kind: 'user_registered',
      userId: input.userId,
      path: ADMIN_USERS_PATH,
    },
  });
};

export const notifyAdminsActivityPublished = (input: {
  activityId: string;
  title: string;
  hostLabel: string;
}): void => {
  void notifyPlatformAdmins({
    title: 'Activity published',
    body: `${input.hostLabel} published "${input.title}".`,
    meta: {
      kind: 'activity_published',
      activityId: input.activityId,
      path: ADMIN_ACTIVITIES_PATH,
    },
  });
};
