import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModel, buildDiscoveryCardViewModelCard } from './discoveryCardViewModel';
import { buildListFeedCards } from '../list/buildListFeedCards';
import { buildDiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  hostedExploreMapItem,
  seekingExploreMapItem,
  venueExploreMapItem,
} from '../explore/exploreMapItemFixtures';
import { resolveVenueBrowsePosterCopy } from '../list/browse/venueBrowseCardCopy';
import { buildDiscoveryEnrichedCard } from './buildDiscoveryEnrichedCard';
import { buildDiscoveryMapListRowCard } from './buildDiscoveryMapListRowCard';

/** RF-02 — discovery VM must match legacy card builder for the same wire item. */
describe('buildDiscoveryCardViewModel (RF-02)', () => {
  it('matches buildDiscoveryCardModel for hosted activity (peek path)', () => {
    const item = hostedExploreMapItem();
    const legacy = buildDiscoveryCardModel(item);
    const { card, projection } = buildDiscoveryCardViewModel(item);
    expect(card.primaryCta).toBe(legacy.primaryCta);
    expect(card.headline).toBe(legacy.headline);
    expect(card.path).toBe(legacy.path);
    expect(projection.primaryCta).toBe(legacy.primaryCta);
    expect(projection.primaryCta).toBe(card.primaryCta);
    expect(projection.headline).toBe(card.headline);
    expect(projection.entityRef).toEqual({ kind: 'activity', activityId: expect.any(String) });
  });

  it('buildDiscoveryCardViewModelCard equals card field', () => {
    const item = venueExploreMapItem();
    const card = buildDiscoveryCardViewModelCard(item);
    const built = buildDiscoveryCardViewModel(item);
    expect(card.id).toBe(built.card.id);
    expect(card.source).toBe('place');
  });

  it('stamps hosted outing counts onto venue cards from the map pool', () => {
    const venue = venueExploreMapItem({
      id: 'venue:trail-1',
      locationCard: { id: 'trail-1' } as ExploreMapItemDTO['locationCard'],
    });
    const outing = hostedExploreMapItem({
      date: '2026-11-15',
      activity: {
        id: 'act-trail',
        title: 'Hatta hike',
        activityType: 'hiking',
        status: 'published',
        participationMode: 'rsvp',
        locationId: 'trail-1',
        date: '2026-11-15',
      } as ExploreMapItemDTO['activity'],
    });
    const seeking = seekingExploreMapItem({
      activity: {
        id: 'act-seek',
        title: 'Looking for Hatta',
        activityType: 'hiking',
        status: 'published',
        participationMode: 'rsvp',
        locationId: 'trail-1',
      } as ExploreMapItemDTO['activity'],
    });
    const poster = buildListFeedCards([venue], null, [venue, outing, seeking])[0];
    expect(poster.venueUpcomingOutingCount).toBe(1);
    expect(poster.venueNextOutingIso).toBe('2026-11-15');
    expect(poster.venueNextOutingPath).toBe('/activity/host-1');
    expect(poster.venueNextOutingExploreItemId).toBe('activity:host-1');
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
    const legacy = buildDiscoveryEnrichedCard(item, pool, null);
    const poster = buildListFeedCards([item], null, pool)[0];
    expect(poster.primaryCta).toBe(legacy.primaryCta);
    expect(poster.headline).toBe(legacy.headline);
  });

  it('venue browse poster copy matches legacy card (RF-02 venue)', () => {
    const item = venueExploreMapItem();
    const legacy = buildDiscoveryCardModel(item);
    const vm = buildDiscoveryCardViewModelCard(item);
    expect(resolveVenueBrowsePosterCopy(vm).heroTitle).toBe(resolveVenueBrowsePosterCopy(legacy).heroTitle);
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

  it('approval vs rsvp primary CTA matches legacy card builder', () => {
    const approvalHike = hostedExploreMapItem({
      activity: {
        id: 'act-approval',
        title: 'Sunrise Hike',
        activityType: 'hiking',
        status: 'published',
        participationMode: 'approval',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);
    const rsvpEvent = hostedExploreMapItem({
      id: 'activity:rsvp-event',
      kind: 'event',
      activity: {
        id: 'act-rsvp',
        title: 'Sunrise Run',
        activityType: 'event',
        status: 'published',
        participationMode: 'rsvp',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);
    const rsvpCamp = hostedExploreMapItem({
      id: 'activity:rsvp-camp',
      kind: 'camping',
      activity: {
        id: 'act-camp',
        title: 'Stargazing camp',
        activityType: 'camping',
        status: 'published',
        participationMode: 'rsvp',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);

    for (const item of [approvalHike, rsvpEvent, rsvpCamp]) {
      const legacy = buildDiscoveryCardModel(item);
      const card = buildDiscoveryCardViewModelCard(item);
      expect(card.primaryCta).toBe(legacy.primaryCta);
    }
    expect(buildDiscoveryCardViewModelCard(approvalHike).primaryCta).toBe('Request to join');
    expect(buildDiscoveryCardViewModelCard(rsvpEvent).primaryCta).toBe("I'm going");
    expect(buildDiscoveryCardViewModelCard(rsvpCamp).primaryCta).toBe("I'm going");
  });
});
