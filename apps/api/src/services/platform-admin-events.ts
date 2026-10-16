import { ADMIN_ACTIVITIES_PATH, ADMIN_USERS_PATH } from '../lib/member-routes.js';
import { notifyPlatformAdmins } from './admin-notifications.js';

export { notifyAdminsCatalogSubmitted, notifyAdminsLocationSubmitted } from './catalog-submit-notifications.js';

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
