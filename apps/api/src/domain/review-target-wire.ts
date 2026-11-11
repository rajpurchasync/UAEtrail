import { ReviewTargetType } from './enums.js';

/** Public API wire values for `targetType` on review routes. */
export type ReviewTargetWire = 'location' | 'tenant' | 'activity' | 'user';

export const reviewTargetWireToEnum = (wire: ReviewTargetWire): ReviewTargetType => {
  if (wire === 'location') return ReviewTargetType.LOCATION;
  if (wire === 'tenant') return ReviewTargetType.TENANT;
  if (wire === 'user') return ReviewTargetType.USER;
  return ReviewTargetType.ACTIVITY;
};

export const reviewTargetEnumToWire = (targetType: ReviewTargetType): ReviewTargetWire => {
  if (targetType === ReviewTargetType.LOCATION) return 'location';
  if (targetType === ReviewTargetType.TENANT) return 'tenant';
  if (targetType === ReviewTargetType.USER) return 'user';
  return 'activity';
};
