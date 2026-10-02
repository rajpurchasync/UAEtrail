/** Professional host / agency / shop application (legacy `/become-host` redirects here). */
export const PRO_MEMBERSHIP_PATH = '/profile/pro-membership';

/** @deprecated Permanent redirect target — do not link in new UI. */
export const LEGACY_BECOME_HOST_PATH = '/become-host';

export const proMembershipPath = (query?: {
  intent?: 'add-guide' | 'add-agency' | 'add-shop';
  redirect?: string;
}): string => {
  if (!query?.intent && !query?.redirect) return PRO_MEMBERSHIP_PATH;
  const params = new URLSearchParams();
  if (query.intent) params.set('intent', query.intent);
  if (query.redirect) params.set('redirect', query.redirect);
  const qs = params.toString();
  return qs ? `${PRO_MEMBERSHIP_PATH}?${qs}` : PRO_MEMBERSHIP_PATH;
};

/** Pro membership screen with in-page anchor (e.g. host profiles). */
export const proMembershipAnchorPath = (fragment: string): string =>
  `${PRO_MEMBERSHIP_PATH}#${fragment.replace(/^#/, '')}`;
