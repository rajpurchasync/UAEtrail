import type { ActivityType } from '../config/activityTypes';

/**
 * Add-place FAB options — each maps to a {@link PlaceKind} via `placeKindFromAddVenueKind`.
 * @see packages/shared-types/src/place-kind.ts
 */
export type AddVenueKind = ActivityType | 'shop' | 'facility';
