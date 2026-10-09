import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

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

/** Canonical M0 seeking pin (participant intent on map). */
export const seekingExploreMapItem = (
  partial: Partial<ExploreMapItemDTO> & { intentId?: string } = {}
): ExploreMapItemDTO => {
  const intentId = partial.intentId ?? partial.participantIntentId ?? 'intent-1';
  const id = partial.id ?? `demand:${intentId}`;
  return base({
    id,
    kind: 'hiking',
    source: 'activity',
    activityMode: 'seeking',
    participantIntentId: intentId,
    path: `/explore?pin=${encodeURIComponent(id)}`,
    composeIntent: 'demand',
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
    composeIntent: 'demand',
    ...partial,
  });

export const venueExploreMapItem = (
  partial: Partial<ExploreMapItemDTO> & { id?: string } = {}
): ExploreMapItemDTO =>
  base({
    id: partial.id ?? 'venue:trail-1',
    kind: 'hiking',
    source: 'venue',
    path: '/trail/trail-1',
    ...partial,
  });
