/**
 * User-facing copy for publishing hosts (guide, agency, shop).
 * Code may use Organisation* / tenant — product language prefers Host + subtypes.
 * @see docs/DOMAIN.md — "Host vs Organisation in copy"
 */

export type HostKind = 'guide' | 'agency' | 'shop';

export const normalizeHostKind = (value?: string | null): HostKind | null => {
  if (!value) return null;
  const key = value.toLowerCase();
  if (key === 'individual' || key === 'guide') return 'guide';
  if (key === 'agency') return 'agency';
  if (key === 'shop') return 'shop';
  return null;
};

export const hostConsoleLabel = (kind?: HostKind | null): string => {
  if (kind === 'guide') return 'Guide console';
  if (kind === 'agency') return 'Agency console';
  if (kind === 'shop') return 'Shop console';
  return 'Host console';
};

export const hostProfileLabel = (kind?: HostKind | null): string => {
  if (kind === 'guide') return 'Guide profile';
  if (kind === 'agency') return 'Agency profile';
  if (kind === 'shop') return 'Shop profile';
  return 'Host profile';
};

export const hostPublicProfileLabel = (kind?: HostKind | null): string => {
  if (kind === 'guide') return 'public guide profile';
  if (kind === 'agency') return 'public agency profile';
  if (kind === 'shop') return 'public shop profile';
  return 'public host profile';
};

export const hostNotFoundLabel = (kind?: HostKind | null): string => {
  if (kind === 'guide') return 'Guide not found';
  if (kind === 'agency') return 'Agency not found';
  if (kind === 'shop') return 'Shop not found';
  return 'Host not found';
};

export const hostSetupTitle = (kind?: HostKind | null): string => {
  if (kind === 'guide') return 'Set up as a guide';
  if (kind === 'agency') return 'Set up your agency';
  if (kind === 'shop') return 'Set up your shop';
  return 'Set up as a host';
};

/** Activity form — tenant the activity is published under. */
export const hostPublishingLabel = 'Host';
