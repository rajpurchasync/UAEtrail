import type { AuthUser } from '@uaetrail/shared-types';

export type PageTab = 'joined' | 'hosted';

/** Primary tabs on /trips — personal hub only (browse lives on /explore). */
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
