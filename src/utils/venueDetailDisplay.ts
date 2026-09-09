import type { Season } from '../types';

/** Auto-set on submit — not meaningful venue metadata from contributors. */
export const isDefaultVenueSeason = (season?: Season[]): boolean =>
  !season?.length || (season.length === 1 && season[0] === 'year-round');

export const hasPositiveNumber = (value?: number | null): value is number =>
  value != null && value > 0;

export const venueLocationPath = (activityType: 'hiking' | 'camping' | 'event', id: string): string => {
  if (activityType === 'camping') return `/camp/${id}`;
  if (activityType === 'event') return `/event/${id}`;
  return `/trail/${id}`;
};
