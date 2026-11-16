import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardModel, discoveryCardUsesActivityPeekEngagement } from '../discovery/discoveryCardModel';
import { availabilityExploreMapItem } from '../explore/exploreMapItemFixtures';

describe('availabilityMapPeekParity (MIG-DISCO-REG)', () => {
  it('uses profile/message peek — not activity join engagement', () => {
    const item = availabilityExploreMapItem({
      userId: 'user-42',
      slotId: 'slot-a',
      title: 'Hatta crew',
    });
    const card = buildDiscoveryCardModel(item);
    expect(card.source).toBe('availability');
    expect(card.primaryCta).toBe('View profile');
    expect(card.secondaryCta).toBe('Message');
    expect(card.showJoinActions).toBe(false);
    expect(discoveryCardUsesActivityPeekEngagement(card)).toBe(false);
  });
});