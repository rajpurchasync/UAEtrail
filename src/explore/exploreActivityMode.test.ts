import { describe, expect, it } from 'vitest';
import {
  exploreMapItemIsRetiredSeekingActivity,
  resolveExploreMapActivityMode,
} from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import {
  availabilityExploreMapItem,
  hostedExploreMapItem,
  seekingExploreMapItem,
} from './exploreMapItemFixtures';

describe('exploreActivityMode (availability catalog)', () => {
  it('resolveExploreMapActivityMode uses explicit activityMode only', () => {
    expect(resolveExploreMapActivityMode(seekingExploreMapItem())).toBe(null);
    expect(resolveExploreMapActivityMode(hostedExploreMapItem())).toBe('hosted');
    expect(
      resolveExploreMapActivityMode({
        id: 'activity:x',
        source: 'activity',
      })
    ).toBe('hosted');
  });

  it('discovery VM badges availability pins only', () => {
    const item = availabilityExploreMapItem({ userId: 'u1', slotId: 's1' });
    const legacy = seekingExploreMapItem();
    const availabilityCard = buildDiscoveryCardViewModelCard(item);
    const legacyCard = buildDiscoveryCardViewModelCard(legacy);
    expect(availabilityCard.source).toBe('availability');
    expect(availabilityCard.requirementBadges).toContain('Available');
    expect(exploreMapItemIsRetiredSeekingActivity(legacy)).toBe(true);
    expect(legacyCard.requirementBadges).not.toContain('Seeking');
    expect(legacyCard.showJoinActions).toBe(false);
  });
});