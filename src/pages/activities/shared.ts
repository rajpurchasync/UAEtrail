import type { AuthUser } from '@uaetrail/shared-types';

export type PageTab = 'explore' | 'joined' | 'hosted';

/** Primary tabs on /activities for signed-in users. */
export const parseTabParam = (value: string | null, user: AuthUser | null): PageTab => {
  if (!user) return 'explore';
  if (value === 'hosted' || value === 'organized') return 'hosted';
  if (value === 'joined' || value === 'mine') return 'joined';
  if (value === 'explore') return 'explore';
  return 'joined';
};
