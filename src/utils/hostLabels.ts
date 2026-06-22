/** Display name for the person responsible for running a trip on the ground. */
export const tripHostName = (trip: {
  hostName?: string;
  organizerName?: string;
}) => trip.hostName ?? trip.organizerName ?? 'Host';

export const tripHostUserId = (trip: {
  hostUserId?: string;
  organizerUserId?: string;
}) => trip.hostUserId ?? trip.organizerUserId;

export const tripHostAvatar = (trip: {
  hostAvatar?: string;
  organizerAvatar?: string;
}) => trip.hostAvatar ?? trip.organizerAvatar;

/** Organization brand — shown when different from the individual host (e.g. companies). */
export const showTenantBrand = (trip: { tenantName?: string; hostName?: string; organizerName?: string }) => {
  const host = tripHostName(trip);
  const org = trip.tenantName?.trim();
  return Boolean(org && org !== host);
};
