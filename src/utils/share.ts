/** Build an absolute share URL for a public app path. */
export const buildShareUrl = (path: string): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${normalized}`;
};

export const buildShareText = (title: string, detail?: string): string =>
  detail ? `${title} — ${detail}` : title;

export const locationSharePath = (activityType: string, locationId: string): string =>
  activityType === 'camping' ? `/camp/${locationId}` : `/trail/${locationId}`;

export const tripSharePath = (tripId: string): string => `/trip/${tripId}`;
