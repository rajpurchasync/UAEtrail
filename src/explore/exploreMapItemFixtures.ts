import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { exploreSeekingMapItemPath } from '@uaetrail/shared-types';

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

/** Canonical M0 seeking pin (published seeking activity on map). */
export const seekingExploreMapItem = (
  partial: Partial<ExploreMapItemDTO> & { intentId?: string; activityId?: string } = {}
): ExploreMapItemDTO => {
  const intentId = partial.intentId ?? partial.participantIntentId ?? 'intent-1';
  const activityId = partial.activityId ?? `seek-${intentId}`;
  const id = partial.id ?? `activity:${activityId}`;
  return base({
    id,
    kind: 'hiking',
    source: 'activity',
    activityMode: 'seeking',
    participantIntentId: intentId,
    path: exploreSeekingMapItemPath({ intentId, activityId }),
    composeIntent: 'seek',
    ...partial,
  });
};

/** Pre-M0 wire — use only in legacy-compat tests. */
export const legacyDemandExploreMapItem = (
  partial: Partial<ExploreMapItemDTO> & { id?: string } = {}
): ExploreMapItemDTO =>
  base({
    id: partial.id ?? 'demand:legacy-1',
    kind: 'hiking',
    source: 'demand',
    participantIntentId: 'legacy-1',
    composeIntent: 'seek',
    ...partial,
  });

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
