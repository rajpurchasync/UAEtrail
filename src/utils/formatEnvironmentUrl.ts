const INTERNAL_DOCKER_HOSTS = new Set(['minio', 'grafana', 'prometheus']);

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const browserHostname = (): string | null => {
  if (typeof window === 'undefined') return null;
  const host = window.location?.hostname?.trim();
  return host || null;
};

/**
 * Rewrite Docker-internal stack hostnames so the browser can resolve them
 * on localhost, LAN Wi-Fi, or Docker. Production S3/Grafana URLs are unchanged.
 */
export const formatEnvironmentUrl = (url: string, hostnameOverride?: string): string => {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('/')) return url;
  if (!isHttpUrl(url)) return url;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!INTERNAL_DOCKER_HOSTS.has(host)) return url;

    const hostname = (hostnameOverride ?? browserHostname())?.trim();
    if (!hostname) return url;

    parsed.hostname = hostname;
    return parsed.toString();
  } catch {
    return url;
  }
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;

/** Recursively rewrite Docker-internal URLs in API JSON payloads. */
export const rewriteEnvironmentUrls = <T>(value: T): T => {
  if (typeof value === 'string') {
    return formatEnvironmentUrl(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteEnvironmentUrls(item)) as T;
  }
  if (!isPlainObject(value)) {
    return value;
  }

  const next: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    next[key] = rewriteEnvironmentUrls(nested);
  }
  return next as T;
};
