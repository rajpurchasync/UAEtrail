import { RETIRED_SEEKING_ACTIVITY_MODE, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import { activityDetailPath } from '../config/routingCatalog';

const base = (
  partial: Partial<ExploreMapItemDTO> & Pick<ExploreMapItemDTO, 'id' | 'kind'>
): ExploreMapItemDTO =>
  ({
    title: 'Fixture outing',
    subtitle: null,
    latitude: 25.1,
    longitude: 55.2,
    path: '/explore',
    ...partial,
  }) as ExploreMapItemDTO;

/** Canonical M0 hosted activity pin. */
export const hostedExploreMapItem = (
  partial: Partial<ExploreMapItemDTO> & { id?: string } = {}
): ExploreMapItemDTO =>
  base({
    id: partial.id ?? 'activity:host-1',
    kind: 'hiking',
    source: 'activity',
    activityMode: 'hosted',
    path: '/activity/host-1',
    ...partial,
  });

/** Retired seeking-as-activity row — catalog must exclude (regression tests only). */
export const excludedSeekingActivityMapItem = (
  partial: Partial<ExploreMapItemDTO> & { activityId?: string } = {}
): ExploreMapItemDTO => {
  const activityId = partial.activityId ?? 'seek-legacy-1';
  return base({
    id: partial.id ?? `activity:${activityId}`,
    kind: 'hiking',
    source: 'activity',
    activityMode: RETIRED_SEEKING_ACTIVITY_MODE as ExploreMapItemDTO['activityMode'],
    path: activityDetailPath(activityId),
    ...partial,
  });
};

/** @deprecated Use {@link excludedSeekingActivityMapItem} */
export const seekingExploreMapItem = excludedSeekingActivityMapItem;

/** Fixed crew availability pin (`member_availability` on explore catalog). */
export const availabilityExploreMapItem = (
  partial: Partial<ExploreMapItemDTO> & { userId?: string; slotId?: string } = {}
): ExploreMapItemDTO => {
  const userId = partial.userId ?? 'user-1';
  const slotId = partial.slotId ?? 'slot-1';
  const id = partial.id ?? `availability:${userId}:${slotId}`;
  return base({
    id,
    kind: 'hiking',
    source: 'availability',
    path: `/member/${userId}?lens=available`,
    featuredPerson: {
      userId,
      displayName: 'Sam',
      avatarUrl: null,
      role: 'host',
    },
    ...partial,
  });
};

export const venueExploreMapItem = (
  partial: Partial<ExploreMapItemDTO> & { id?: string } = {}
): ExploreMapItemDTO =>
  base({
    id: partial.id ?? 'venue:trail-1',
    kind: 'hiking',
    source: 'place',
    path: '/trail/trail-1',
    ...partial,
  });