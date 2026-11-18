import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import { hostedExploreMapItem } from '../explore/exploreMapItemFixtures';
import { resolveActivityMapPeekLocationLine } from './resolveActivityMapPeekLocationLine';
import { resolveActivityMapPeekEssentials } from './resolveActivityMapPeekEssentials';
import { resolveActivityMapPeekPolicyLabels } from './resolveActivityMapPeekPolicyLabels';
import { resolveActivityMapPeekCapacityLine } from './resolveActivityMapPeekCapacityLine';

describe('map peek structured layout resolvers', () => {
  const baseCard = () =>
    buildDiscoveryCardViewModelCard(
      hostedExploreMapItem({
        subtitle: 'Ras Al Khaimah · Rak Beach Camp',
        activity: {
          id: 'a1',
          title: 'M3 group hike',
          activityType: 'hiking',
          status: 'published',
          participationMode: 'approval',
          slotsTotal: 16,
          slotsFilled: 1,
        },
      } as Parameters<typeof hostedExploreMapItem>[0])
    );

  const cardWithParty = () => {
    const card = baseCard();
    return {
      ...card,
      sections: { ...card.sections, partyLabel: '15 going' },
    };
  };

  it('surfaces location from browse meta', () => {
    const line = resolveActivityMapPeekLocationLine(baseCard());
    expect(line).not.toBeNull();
    expect(line!).toMatch(/Rak Beach Camp|Ras Al Khaimah/i);
  });

  it('essentials combine price and join mode', () => {
    const card = { ...baseCard(), price: { kind: 'free' as const, badge: 'Free' } };
    const essentials = resolveActivityMapPeekEssentials(card);
    expect(essentials.summaryLine).toBe('Free · Host approval');
  });

  it('policy strip lists requirement badges without capacity', () => {
    const card = { ...baseCard(), requirementBadges: ['Pets welcome', 'Women only'] };
    const labels = resolveActivityMapPeekPolicyLabels(card);
    expect(labels).toContain('Pets welcome');
    expect(labels).toContain('Women only');
    expect(labels.some((l) => /spots left/i.test(l))).toBe(false);
  });

  it('capacity is a dedicated line', () => {
    const line = resolveActivityMapPeekCapacityLine(cardWithParty());
    expect(line).not.toBeNull();
    expect(line!).toMatch(/spots/);
  });
});