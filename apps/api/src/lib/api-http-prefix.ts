/** Unversioned HTTP API mount (pre-release — no `/v1` segment). */
export const API_HTTP_PREFIX = '/api';

export const apiHttpPath = (suffix: string): string => {
  const normalized = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `${API_HTTP_PREFIX}${normalized}`;
};
