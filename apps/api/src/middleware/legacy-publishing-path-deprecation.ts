import type { RequestHandler } from 'express';

const API_PREFIX = '/api/v1';

const canonicalPathForDeprecatedRequest = (pathname: string): string | null => {
  if (pathname.startsWith(`${API_PREFIX}/host`)) {
    return pathname.replace(`${API_PREFIX}/host`, `${API_PREFIX}/operator`);
  }
  if (pathname === `${API_PREFIX}/me/host-status` || pathname === `${API_PREFIX}/me/operator-status`) {
    return `${API_PREFIX}/me/status`;
  }
  return null;
};

/** Marks legacy `/host/*` and legacy member status routes with RFC 8594-style deprecation headers. */
export const legacyPublishingPathDeprecation: RequestHandler = (req, res, next) => {
  const pathname = (req.originalUrl ?? req.url).split('?')[0] ?? '';
  const canonical = canonicalPathForDeprecatedRequest(pathname);
  if (canonical) {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Link', `<${canonical}>; rel="alternate"`);
  }
  next();
};
