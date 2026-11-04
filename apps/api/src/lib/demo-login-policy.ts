/**
 * Demo login is disabled in production. Never use Host / X-Forwarded-Host for this gate
 * (client-controlled headers must not unlock demo accounts behind a reverse proxy).
 */
export const isLoopbackAddress = (ip: string | undefined): boolean => {
  if (!ip) return false;
  const normalized = ip.replace(/^::ffff:/, '');
  return normalized === '127.0.0.1' || normalized === '::1';
};

const normalizeRunEnv = (runEnv: string | undefined): string | undefined => {
  if (runEnv === undefined || runEnv.trim() === '') return undefined;
  const lowered = runEnv.trim().toLowerCase();
  return lowered === 'local' ? 'test' : lowered;
};

export const isDemoLoginAllowedForRequest = (
  nodeEnv: 'development' | 'test' | 'production',
  remoteAddress: string | undefined,
  allowDemoLoginEnv?: string | undefined,
  runEnv?: string | undefined
): boolean => {
  if (nodeEnv === 'production') return false;
  const normalizedRunEnv = normalizeRunEnv(runEnv);
  if (normalizedRunEnv === 'production') return false;
  if (nodeEnv === 'test') return true;
  if (normalizedRunEnv === 'test' || normalizedRunEnv === 'staging') return true;
  if (allowDemoLoginEnv === 'true') return true;
  if (nodeEnv === 'development') {
    return isLoopbackAddress(remoteAddress);
  }
  return false;
};
