/**
 * Demo login is disabled in production. Never use Host / X-Forwarded-Host for this gate
 * (client-controlled headers must not unlock demo accounts behind a reverse proxy).
 */
export const isLoopbackAddress = (ip: string | undefined): boolean => {
  if (!ip) return false;
  const normalized = ip.replace(/^::ffff:/, '');
  return normalized === '127.0.0.1' || normalized === '::1';
};

export const isDemoLoginAllowedForRequest = (
  nodeEnv: 'development' | 'test' | 'production',
  remoteAddress: string | undefined,
  allowDemoLoginEnv?: string | undefined
): boolean => {
  if (nodeEnv === 'test') return true;
  if (nodeEnv === 'production') return false;
  if (allowDemoLoginEnv === 'true') return true;
  return isLoopbackAddress(remoteAddress);
};
