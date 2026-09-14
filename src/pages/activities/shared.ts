import type { AuthUser } from '@uaetrail/shared-types';

export type PageTab = 'joined' | 'hosted';

/** Primary tabs on /activities — personal hub only (browse lives on /explore). */
export const parseTabParam = (value: string | null, user: AuthUser | null): PageTab => {
  if (!user) return 'joined';
  if (value === 'hosted' || value === 'organized') return 'hosted';
  return 'joined';
};
