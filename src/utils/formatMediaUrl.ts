import { formatEnvironmentUrl } from './formatEnvironmentUrl';

const KNOWN_BUCKETS = ['uaetrail-private', 'uaetrail-public', 'uaetrail-assets'];

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
    const mediaIdx = parts.findIndex((part, index) => part === 'media' && ['local', 'public'].includes(parts[index + 1] ?? ''));
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
 * Public objects are served through the API proxy so MinIO/S3 ACLs are not required.
 */
export const formatMediaUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.includes('/api/v1/media/resolve?')) {
    return formatEnvironmentUrl(url);
  }

  const key = extractMediaStorageKey(url);
  if (key) {
    return `/api/v1/media/public/${key}`;
  }

  return formatEnvironmentUrl(url);
};
