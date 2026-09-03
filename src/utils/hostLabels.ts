type HostIdentity = {
  hostName?: string;
  organizerName?: string;
};

type HostUserIdentity = {
  hostUserId?: string;
  organizerUserId?: string;
};

type HostAvatarIdentity = {
  hostAvatar?: string;
  organizerAvatar?: string;
};

/** Display name for the person responsible for running an activity on the ground. */
export const activityHostName = (activity: HostIdentity) =>
  activity.hostName ?? activity.organizerName ?? 'Host';

/** @deprecated Use activityHostName */
export const tripHostName = activityHostName;

export const activityHostUserId = (activity: HostUserIdentity) =>
  activity.hostUserId ?? activity.organizerUserId;

/** @deprecated Use activityHostUserId */
export const tripHostUserId = activityHostUserId;

export const activityHostAvatar = (activity: HostAvatarIdentity) =>
  activity.hostAvatar ?? activity.organizerAvatar;

/** @deprecated Use activityHostAvatar */
export const tripHostAvatar = activityHostAvatar;

/** Organization brand — shown when different from the individual host (e.g. companies). */
export const showTenantBrand = (activity: { tenantName?: string; hostName?: string; organizerName?: string }) => {
  const host = activityHostName(activity);
  const org = activity.tenantName?.trim();
  return Boolean(org && org !== host);
};
