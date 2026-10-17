import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildDiscoveryCardViewModel, buildDiscoveryCardViewModelCard } from './discoveryCardViewModel';
import { buildListFeedCards } from '../list/buildListFeedCards';
import { buildExploreCardModel } from '../explore/exploreCardModel';
import { hostedExploreMapItem, venueExploreMapItem } from '../explore/exploreMapItemFixtures';
import { resolveListVenuePosterCopy } from '../list/listVenuePosterPresentation';
import { buildDiscoveryEnrichedCard } from './buildDiscoveryEnrichedCard';
import { buildDiscoveryMapListRowCard } from './buildDiscoveryMapListRowCard';

/** RF-02 — discovery VM must match legacy card builder for the same wire item. */
describe('buildDiscoveryCardViewModel (RF-02)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses API discoveryCard when VITE_EXPLORE_MAP_DISCOVERY_PROJECTION=1', () => {
    vi.stubEnv('VITE_EXPLORE_MAP_DISCOVERY_PROJECTION', '1');
    const item = hostedExploreMapItem();
    const serverProjection = {
      entityRef: { kind: 'activity' as const, activityId: item.id },
      path: item.path,
      sharePath: item.path,
      source: item.source,
      kind: item.kind,
      headline: 'Server headline',
      listTitle: 'Server list',
      subtitle: null,
      primaryCta: 'View plan',
      imageUrl: null,
      requirementChips: []
    };
    const wired = { ...item, discoveryCard: serverProjection };
    const { projection, card } = buildDiscoveryCardViewModel(wired);
    expect(projection.headline).toBe('Server headline');
    expect(projection).toEqual(serverProjection);
    expect(card.headline).toBe('Server headline');
    expect(card.listTitle).toBe('Server list');

    const [listCard] = buildListFeedCards([wired], null);
    expect(listCard.headline).toBe('Server headline');
  });

  it('matches buildExploreCardModel for hosted activity (peek path)', () => {
    const item = hostedExploreMapItem();
    const legacy = buildExploreCardModel(item);
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
    const legacy = buildDiscoveryEnrichedCard(item, pool, null);
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
      const legacy = buildExploreCardModel(item);
      const card = buildDiscoveryCardViewModelCard(item);
      expect(card.primaryCta).toBe(legacy.primaryCta);
    }
    expect(buildDiscoveryCardViewModelCard(approvalHike).primaryCta).toBe('Request to join');
    expect(buildDiscoveryCardViewModelCard(rsvpEvent).primaryCta).toBe("I'm going");
    expect(buildDiscoveryCardViewModelCard(rsvpCamp).primaryCta).toBe("I'm going");
  });
});
