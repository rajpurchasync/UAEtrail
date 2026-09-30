import type { PlaceKind } from '@uaetrail/shared-types';
import type { ActivityType } from '../config/activityTypes';

/**
 * Add-place FAB options — each maps to a {@link PlaceKind} via `placeKindFromContributeVenueKind`.
 * @see packages/shared-types/src/place-kind.ts
 */
export type ContributeVenueKind = ActivityType | 'shop';

/** Canonical kind for a contribute selection (shop and “Others” included). */
export type ContributePlaceKind = PlaceKind;
