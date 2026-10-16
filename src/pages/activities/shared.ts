import type { AuthUser } from '@uaetrail/shared-types';

export type PageTab = 'joined' | 'hosted';

/** Legacy joined/hosted tab param helpers (mobile header); Plan tab is `/plan`. */
export const parseTabParam = (value: string | null, user: AuthUser | null): PageTab => {
  if (!user) return 'joined';
  if (value === 'hosted' || value === 'organized') return 'hosted';
  return 'joined';
};

export const joinedSubViewTitle = (sub: string | null): string | null => {
  switch (sub) {
    case 'attended':
      return 'Past';
    case 'upcoming':
      return 'Scheduled';
    case 'cancelled':
      return 'Cancelled';
    case 'rejected':
      return 'Not this time';
    default:
      return null;
  }
};
