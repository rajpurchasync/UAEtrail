import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import { hostedExploreMapItem } from '../explore/exploreMapItemFixtures';
import { resolveActivityMapPeekStatChips } from './resolveActivityMapPeekStatChips';
import { resolveActivityMapPeekTitle } from './resolveActivityMapPeekTitle';

describe('resolveActivityMapPeekStatChips', () => {
  it('kind chips stay rideshare/seeking — not policy or spots', () => {
    const card = buildDiscoveryCardViewModelCard(
      hostedExploreMapItem({
        activity: {
          id: 'a1',
          title: 'M2 group hike',
          activityType: 'hiking',
          status: 'published',
          participationMode: 'approval',
          slotsTotal: 16,
          slotsFilled: 0,
        },
      } as Parameters<typeof hostedExploreMapItem>[0])
    );
    const withBadge = { ...card, requirementBadges: ['Pets welcome'] };
    const labels = resolveActivityMapPeekStatChips(withBadge).map((chip) => chip.label);
    expect(labels.filter((l) => /pets welcome/i.test(l))).toHaveLength(0);
    expect(labels.filter((l) => /spots/i.test(l))).toHaveLength(0);
  });
});

describe('resolveActivityMapPeekTitle', () => {
  it('prefers activity.title over social headline sections', () => {
    const card = buildDiscoveryCardViewModelCard(
      hostedExploreMapItem({
        activity: {
          id: 'a1',
          title: 'M2 group hike — Uaq Mangrove Boardwalk #3',
          activityType: 'hiking',
          status: 'published',
        },
      } as Parameters<typeof hostedExploreMapItem>[0])
    );
    expect(resolveActivityMapPeekTitle(card)).toBe('M2 group hike — Uaq Mangrove Boardwalk #3');
  });
});