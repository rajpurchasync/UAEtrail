import { formatEnvironmentUrl } from './formatEnvironmentUrl';

const KNOWN_BUCKETS = ['uaetrail-private', 'uaetrail-public', 'uaetrail-assets'];

const KIND_FROM_SEGMENT: Record<string, string> = {
  avatars: 'avatar',
  waivers: 'waiver',
  'private-photos': 'private_photo',
  uploads: 'general',
  activities: 'activity',
  events: 'activity',
  locations: 'location',
  shop: 'shop',
  guides: 'guide',
};

const PRIVATE_MEDIA_KINDS = new Set(['avatar', 'waiver', 'private_photo']);

const mediaKindFromStorageKey = (key: string): string => {
  const parts = key.split('/').filter(Boolean);
  if (parts[0] === 'users' && parts[2]) {
    return KIND_FROM_SEGMENT[parts[2]] ?? 'general';
  }
  if (parts[0] === 'tenants' && parts[2]) {
    return KIND_FROM_SEGMENT[parts[2]] ?? 'general';
  }
  return 'general';
};

const isPrivateMediaKey = (key: string): boolean => PRIVATE_MEDIA_KINDS.has(mediaKindFromStorageKey(key));

const resolveMediaPath = (key: string): string =>
  `/api/media/resolve?key=${encodeURIComponent(key)}`;

/** Extract a storage object key from a media URL or key string. */
export const extractMediaStorageKey = (raw: string): string | null => {
  const value = raw.trim();
  if (!value) return null;
  if (/^(users|tenants)\//.test(value)) {
    return value.split('?')[0];
  }

  try {
    const url = value.startsWith('http://') || value.startsWith('https://')
      ? new URL(value)
      : new URL(value, 'http://placeholder.local');
    const fromQuery = url.searchParams.get('key');
    if (fromQuery) return fromQuery;

    const parts = url.pathname.split('/').filter(Boolean);
    const mediaIdx = parts.findIndex((part, index) =>
      part === 'media' && ['local', 'public'].includes(parts[index + 1] ?? '')
    );
    if (mediaIdx >= 0) {
      const rest = parts.slice(mediaIdx + 2).join('/');
      return rest || null;
    }

    const bucketIdx = parts.findIndex((part) => KNOWN_BUCKETS.includes(part));
    if (bucketIdx >= 0) {
      const rest = parts.slice(bucketIdx + 1).join('/');
      return rest || null;
    }
  } catch {
    return null;
  }

  return null;
};

/**
 * Resolve a stored media URL for browser display/download.
 * Public objects use the API proxy; avatars and other private kinds use /media/resolve.
 */
export const formatMediaUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.includes('/api/media/resolve?')) {
    return formatEnvironmentUrl(url);
  }

  const key = extractMediaStorageKey(url);
  if (key) {
    if (isPrivateMediaKey(key)) {
      return formatEnvironmentUrl(resolveMediaPath(key));
    }
    return `/api/media/public/${key}`;
  }

  return formatEnvironmentUrl(url);
};

/** Prefer stored `-thumb.jpg` sibling for map/list/catalog when the full asset is public. */
export const formatMediaCatalogUrl = (url: string): string => {
  const resolved = formatMediaUrl(url);
  const key = extractMediaStorageKey(resolved);
  if (!key || isPrivateMediaKey(key)) return resolved;
  const dot = key.lastIndexOf('.');
  if (dot <= 0) return resolved;
  const thumbKey = `${key.slice(0, dot)}-thumb.jpg`;
  return `/api/media/public/${thumbKey}`;
};
