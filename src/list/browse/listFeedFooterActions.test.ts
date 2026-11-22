import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { resolveListFeedFooterModel } from './listFeedFooterActions';

const activityCard = (viewerAccess: DiscoveryCardModel['viewerAccess']): DiscoveryCardModel => {
  const base = buildDiscoveryCardViewModelCard({
    id: 'activity:a1',
    kind: 'hiking',
    source: 'activity',
    title: 'Hike',
    latitude: 25,
    longitude: 56,
    path: '/activity/a1',
    activity: {
      id: 'a1',
      tenantId: 't1',
      tenantSlug: 'h',
      locationId: 'l1',
      locationName: 'Trail',
      activityType: 'hiking',
      title: 'Hike',
      description: '',
      date: '2026-10-12',
      time: '09:00',
      price: 0,
      slotsTotal: 10,
      slotsAvailable: 5,
      status: 'published',
    },
  } as ExploreMapItemDTO);
  return {
    ...base,
    showJoinActions: true,
    primaryCta: 'Request to join',
    secondaryCta: 'View details',
    viewerAccess,
  };
};

describe('resolveListFeedFooterModel — peek CTA parity', () => {
  it('pairs request_join primary with view_detail secondary (text wire)', () => {
    const card = activityCard({
      exposure: 'full',
      level: 'public',
      gateReason: null,
      canViewFullActivity: true,
      canOpenDetailPage: true,
      joinMode: 'open',
      canAccessCrewSurfaces: false,
      mapPeekActions: [
        { id: 'request_join', prominence: 'primary' },
        { id: 'view_detail', prominence: 'text' },
      ],
    });
    const model = resolveListFeedFooterModel(card, { isGuest: false });
    expect(model.primary).toMatchObject({ kind: 'action', actionId: 'request_join' });
    expect(model.secondary).toMatchObject({ kind: 'link', href: '/activity/a1' });
  });

  it('uses fallback join action + details when wire actions are absent', () => {
    const card = activityCard({
      exposure: 'full',
      level: 'public',
      gateReason: null,
      canViewFullActivity: true,
      canOpenDetailPage: true,
      joinMode: 'open',
      canAccessCrewSurfaces: false,
      mapPeekActions: [],
    });
    const model = resolveListFeedFooterModel(card, { isGuest: false });
    expect(model.primary).toMatchObject({ kind: 'action', actionId: 'request_join' });
    expect(model.secondary).toMatchObject({ kind: 'link' });
    expect(model.usesJoinFlow).toBe(true);
  });
});