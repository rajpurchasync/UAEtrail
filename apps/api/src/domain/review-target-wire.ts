import { ReviewTargetType } from './enums.js';

/** Public API wire values for `targetType` on review routes. */
export type ReviewTargetWire = 'location' | 'tenant' | 'activity';

export const reviewTargetWireToEnum = (wire: ReviewTargetWire): ReviewTargetType => {
  if (wire === 'location') return ReviewTargetType.LOCATION;
  if (wire === 'tenant') return ReviewTargetType.TENANT;
  return ReviewTargetType.ACTIVITY;
};

export const reviewTargetEnumToWire = (targetType: ReviewTargetType): ReviewTargetWire => {
  if (targetType === ReviewTargetType.LOCATION) return 'location';
  if (targetType === ReviewTargetType.TENANT) return 'tenant';
  return 'activity';
};
