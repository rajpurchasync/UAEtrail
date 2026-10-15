import { describe, expect, it } from 'vitest';
import { buildExploreSelectionSelectedCard } from './exploreSelectionSelectedCard';
import { hostedExploreMapItem, seekingExploreMapItem } from './exploreMapItemFixtures';

describe('buildExploreSelectionSelectedCard', () => {
  it('uses activity wire peek when viewer hosts a seeking activity', () => {
    const item = seekingExploreMapItem({
      intentId: 'int-1',
      activityId: 'seek-1',
      requesterUserId: 'user-host',
      activity: {
        id: 'seek-1',
        tenantId: 't-buddy',
        hostUserId: 'user-host',
        status: 'published',
        title: 'Looking for hikers',
        activityType: 'hiking',
        joinMode: 'open',
        requirements: [],
      },
    });
    const card = buildExploreSelectionSelectedCard(item, [item], { id: 'user-host' });
    expect(card).not.toBeNull();
    expect(card?.showJoinActions).toBe(false);
  });

  it('hides join actions for own hosted activity', () => {
    const item = hostedExploreMapItem({
      activity: {
        id: 'host-1',
        tenantId: 't1',
        hostUserId: 'user-host',
        status: 'published',
        title: 'Hike',
        activityType: 'hiking',
        joinMode: 'open',
        requirements: [],
      },
    });
    const card = buildExploreSelectionSelectedCard(item, [item], { id: 'user-host' });
    expect(card?.showJoinActions).toBe(false);
  });
});
