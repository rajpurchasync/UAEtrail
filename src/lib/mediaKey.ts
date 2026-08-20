const KNOWN_BUCKETS = ['uaetrail-private', 'uaetrail-public', 'uaetrail-assets'];

export const extractMediaKey = (src: string): string | null => {
  const value = src.trim();
  if (!value) return null;
  if (value.startsWith('blob:') || value.startsWith('data:')) return null;
  if (/^(users|tenants)\//.test(value)) return value.split('?')[0];

  try {
    const url =
      value.startsWith('http://') || value.startsWith('https://')
        ? new URL(value)
        : new URL(value, 'http://placeholder.local');
    const fromQuery = url.searchParams.get('key');
    if (fromQuery) return fromQuery;

    const parts = url.pathname.split('/').filter(Boolean);
    const mediaIdx = parts.findIndex((part, index) => part === 'media' && parts[index + 1] === 'local');
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
