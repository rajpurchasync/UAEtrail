import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardViewModel, buildDiscoveryCardViewModelCard } from './discoveryCardViewModel';
import { buildExploreCardModel } from '../explore/exploreCardModel';
import { hostedExploreMapItem, venueExploreMapItem } from '../explore/exploreMapItemFixtures';
import { resolveListVenuePosterCopy } from '../list/listVenuePosterPresentation';
import { buildListFeedCards } from '../list/buildListFeedCards';
import { enrichListFeedCardModel } from '../list/enrichListFeedCard';
import { buildDiscoveryMapListRowCard } from './buildDiscoveryMapListRowCard';

/** RF-02 — discovery VM must match legacy card builder for the same wire item. */
describe('buildDiscoveryCardViewModel (RF-02)', () => {
  it('matches buildExploreCardModel for hosted activity (peek path)', () => {
    const item = hostedExploreMapItem();
    const legacy = buildExploreCardModel(item);
    const { card, projection } = buildDiscoveryCardViewModel(item);
    expect(card.primaryCta).toBe(legacy.primaryCta);
    expect(card.headline).toBe(legacy.headline);
    expect(card.path).toBe(legacy.path);
    expect(projection.primaryCta).toBe(legacy.primaryCta);
    expect(projection.entityRef).toEqual({ kind: 'activity', activityId: expect.any(String) });
  });

  it('buildDiscoveryCardViewModelCard equals card field', () => {
    const item = venueExploreMapItem();
    const card = buildDiscoveryCardViewModelCard(item);
    const built = buildDiscoveryCardViewModel(item);
    expect(card.id).toBe(built.card.id);
    expect(card.source).toBe('venue');
  });

  it('buildListFeedCards matches legacy enrich path (RF-02 poster)', () => {
    const item = hostedExploreMapItem({
      activity: {
        id: 'act-1',
        title: 'Friday hike',
        activityType: 'hiking',
        status: 'published',
        participationMode: 'approval',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);
    const pool = [item];
    const legacy = enrichListFeedCardModel(buildExploreCardModel(item), item, pool, null);
    const poster = buildListFeedCards([item], null, pool)[0];
    expect(poster.primaryCta).toBe(legacy.primaryCta);
    expect(poster.headline).toBe(legacy.headline);
  });

  it('venue browse poster copy matches legacy card (RF-02 venue)', () => {
    const item = venueExploreMapItem();
    const legacy = buildExploreCardModel(item);
    const vm = buildDiscoveryCardViewModelCard(item);
    expect(resolveListVenuePosterCopy(vm).heroTitle).toBe(resolveListVenuePosterCopy(legacy).heroTitle);
    expect(vm.primaryCta).toBe(legacy.primaryCta);
  });

  it('buildDiscoveryMapListRowCard matches list feed card sans poster cover', () => {
    const item = hostedExploreMapItem({
      activity: {
        id: 'act-2',
        title: 'Camp night',
        activityType: 'camping',
        status: 'published',
        participationMode: 'rsvp',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);
    const pool = [item];
    const row = buildDiscoveryMapListRowCard(item, pool);
    const poster = buildListFeedCards([item], null, pool)[0];
    expect(row.primaryCta).toBe(poster.primaryCta);
  });
});
