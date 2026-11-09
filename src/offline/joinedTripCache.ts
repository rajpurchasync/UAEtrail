/** Cache keys for the scoped joined-trip service worker (plan §15.5). Cap 2 MB. */
export const JOINED_TRIP_CACHE = 'uaetrail-joined-trip-v1';
export const JOINED_TRIP_SW_PATH = '/joined-trip-sw.js';
export const JOINED_TRIP_SW_SCOPE = '/plan/';
export const JOINED_TRIP_MAX_BYTES = 2 * 1024 * 1024;

export const joinedTripCacheUrls = (activityId: string): string[] => {
  const id = encodeURIComponent(activityId);
  return [`/api/activities/${id}`, `/api/activities/${id}/private`];
};

export const isJoinedTripCacheUrl = (url: string, allowed: string[]): boolean => {
  try {
    const path = new URL(url, 'https://uaetrail.local').pathname;
    return allowed.some((item) => {
      const allowedPath = new URL(item, 'https://uaetrail.local').pathname;
      return path === allowedPath;
    });
  } catch {
    return false;
  }
};
