import { describe, expect, it } from 'vitest';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { resolveExploreEntityFollowTarget } from '../discovery/discoveryCardModel';

const card = (overrides: Partial<DiscoveryCardModel>): DiscoveryCardModel =>
  ({
    id: 'x',
    path: '/explore',
    source: 'venue',
    kind: 'hiking',
    ...overrides,
  }) as DiscoveryCardModel;

describe('resolveExploreEntityFollowTarget', () => {
  it('returns location for venue cards', () => {
    expect(resolveExploreEntityFollowTarget(card({ source: 'venue', locationId: 'loc-1' }))).toEqual({
      locationId: 'loc-1',
    });
  });

  it('uses activity location when venue locationCard is absent', () => {
    expect(
      resolveExploreEntityFollowTarget(
        card({
          source: 'activity',
          locationId: 'loc-from-activity',
          activity: { id: 'a1', locationId: 'loc-from-activity', tenantId: 't1' },
        } as Partial<DiscoveryCardModel>)
      )
    ).toEqual({ locationId: 'loc-from-activity' });
  });

  it('returns null for demand pins', () => {
    expect(
      resolveExploreEntityFollowTarget(
        card({
          source: 'activity',
          activityMode: 'seeking',
          composeIntent: 'seek',
          participantIntentId: 'd1',
          locationId: 'loc-1',
        })
      )
    ).toBeNull();
  });
});
