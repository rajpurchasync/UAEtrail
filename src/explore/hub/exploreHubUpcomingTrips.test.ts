import { describe, expect, it } from 'vitest';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { pickExploreHubUpcomingTripCards } from './exploreHubUpcomingTrips';

const card = (id: string, dateIso: string | null, subtitle: string): DiscoveryCardModel =>
  ({
    id,
    path: `/activity/${id}`,
    source: 'activity',
    kind: 'activity',
    tone: 'activity',
    emoji: '',
    headline: '',
    listTitle: '',
    listHost: null,
    subtitle,
    price: null,
    spotsLabel: null,
    venueHint: null,
    showJoinHint: false,
    primaryCta: '',
    secondaryCta: null,
    scheduleDate: dateIso,
    activity: dateIso ? { date: dateIso, title: id } : undefined,
  }) as DiscoveryCardModel;

describe('pickExploreHubUpcomingTripCards', () => {
  it('returns up to three soonest dated trips', () => {
    const picked = pickExploreHubUpcomingTripCards(
      [
        card('c', '2099-06-01', 'Fujairah'),
        card('a', '2099-03-01', 'Dubai'),
        card('b', '2099-04-01', 'Dubai'),
        card('d', '2099-07-01', 'RAK'),
      ],
      'Dubai',
      3
    );
    expect(picked.map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });
});