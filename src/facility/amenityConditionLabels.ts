import type { AmenityState } from '@uaetrail/shared-types';

export const amenityConditionLabel = (state: AmenityState | undefined | null): string => {
  if (state === 'working') return 'Working';
  if (state === 'not_working') return 'Not working / dry';
  return 'Unknown';
};

export const amenityReviewInProgressMessage = (state: AmenityState): string =>
  `A review is already in progress for “${amenityConditionLabel(state)}”. You do not need to report again.`;
