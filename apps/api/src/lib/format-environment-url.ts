const INTERNAL_DOCKER_HOSTS = new Set(['minio', 'grafana', 'prometheus']);

/**
 * Rewrite Docker-internal MinIO hosts so browser/Vite/Nginx clients can fetch
 * presigned URLs. Signature query params are preserved.
 */
export const formatEnvironmentUrl = (url: string, publicBaseUrl?: string): string => {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (!/^https?:\/\//i.test(url)) return url;
  if (!publicBaseUrl) return url;

  try {
    const parsed = new URL(url);
    if (!INTERNAL_DOCKER_HOSTS.has(parsed.hostname.toLowerCase())) return url;

    const publicUrl = new URL(publicBaseUrl);
    parsed.hostname = publicUrl.hostname;
    if (publicUrl.port) {
      parsed.port = publicUrl.port;
    }
    if (publicUrl.protocol) {
      parsed.protocol = publicUrl.protocol;
    }
    return parsed.toString();
  } catch {
    return url;
  }
};
