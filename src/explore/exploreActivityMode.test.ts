import { describe, expect, it } from 'vitest';
import { exploreMapItemIsSeeking, resolveExploreMapActivityMode } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import { hostedExploreMapItem, seekingExploreMapItem } from './exploreMapItemFixtures';

describe('exploreActivityMode (M0)', () => {
  it('resolveExploreMapActivityMode uses activityMode and hosted activity source', () => {
    expect(resolveExploreMapActivityMode(seekingExploreMapItem())).toBe('seeking');
    expect(resolveExploreMapActivityMode(hostedExploreMapItem())).toBe('hosted');
    expect(
      resolveExploreMapActivityMode({
        id: 'demand:int-1',
        source: 'demand' as never,
        participantIntentId: 'int-1',
      })
    ).toBeNull();
  });

  it('discovery VM adds Seeking badge with activity wire source', () => {
    const item = seekingExploreMapItem();
    const card = buildDiscoveryCardViewModelCard(item);
    expect(exploreMapItemIsSeeking(item)).toBe(true);
    expect(card.source).toBe('activity');
    expect(card.composeIntent).toBe('seek');
    expect(card.requirementBadges).toContain('Seeking');
  });
});
