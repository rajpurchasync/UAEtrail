/** Build an absolute share URL for a public app path. */
export const buildShareUrl = (path: string): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${normalized}`;
};

export const buildShareText = (title: string, detail?: string): string =>
  detail ? `${title} — ${detail}` : title;

export const locationDetailPath = (activityType: string, locationId: string): string => {
  const kind = activityType.toLowerCase();
  if (kind === 'camping') return `/camp/${locationId}`;
  if (kind === 'event' || kind === 'community_activity') return `/event/${locationId}`;
  return `/trail/${locationId}`;
};

export const locationReviewPath = (activityType: string, locationId: string): string =>
  `${locationDetailPath(activityType, locationId)}#reviews`;

export const locationSharePath = (activityType: string, locationId: string): string =>
  locationDetailPath(activityType, locationId);
