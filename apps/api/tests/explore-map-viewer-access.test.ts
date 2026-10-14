import { describe, expect, it } from 'vitest';
import { RequestStatus } from '../src/domain/enums.js';
import { resolveCommerceMapViewerAccess } from '@uaetrail/shared-types';
import {
  attachExploreMapViewerAccess,
  resolveDemandMapViewerAccess,
} from '../src/lib/explore-map-viewer-access.js';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

const openActivityItem = (): ExploreMapItemDTO => ({
  id: 'activity:a1',
  kind: 'hiking',
  source: 'activity',
  title: 'Hike',
  latitude: 25,
  longitude: 55,
  path: '/activity/a1',
  activity: {
    id: 'a1',
    tenantId: 't1',
    hostUserId: 'host-1',
    status: 'published',
    title: 'Hike',
    joinMode: 'open',
    requirements: [],
  } as ExploreMapItemDTO['activity'],
});

describe('resolveDemandMapViewerAccess', () => {
  it('gates guests with sign_in', () => {
    const access = resolveDemandMapViewerAccess({
      viewerUserId: null,
      requesterUserId: 'owner',
      joinRequestStatus: null,
    });
    expect(access.gateReason).toBe('sign_in');
    expect(access.exposure).toBe('redacted');
  });

  it('grants full detail to requester', () => {
    const access = resolveDemandMapViewerAccess({
      viewerUserId: 'owner',
      requesterUserId: 'owner',
      joinRequestStatus: null,
    });
    expect(access.exposure).toBe('full');
    expect(access.gateReason).toBeNull();
  });
});

describe('resolveCommerceMapViewerAccess', () => {
  it('requires sign-in for guests', () => {
    const access = resolveCommerceMapViewerAccess(null);
    expect(access.gateReason).toBe('sign_in');
    expect(access.canOpenDetailPage).toBe(false);
  });

  it('allows members to open shop detail', () => {
    const access = resolveCommerceMapViewerAccess('user-1');
    expect(access.exposure).toBe('full');
    expect(access.gateReason).toBeNull();
  });
});

describe('attachExploreMapViewerAccess', () => {
  it('attaches guest viewerAccess on open activities', () => {
    const items: ExploreMapItemDTO[] = [
      {
        id: 'activity:a1',
        kind: 'hiking',
        source: 'activity',
        title: 'Hike',
        latitude: 25,
        longitude: 55,
        path: '/activity/a1',
        activity: {
          id: 'a1',
          tenantId: 't1',
          title: 'Hike',
          joinMode: 'open',
          requirements: [],
        } as ExploreMapItemDTO['activity'],
      },
    ];

    const enriched = attachExploreMapViewerAccess(items, {
      viewerUserId: null,
      isPlatformAdmin: false,
      participantActivityIds: new Set(),
      requestStatusByActivityId: new Map(),
      staffTenantIds: new Set(),
      demandJoinStatusByIntentId: new Map(),
      hostStatus: null,
      buddyUserIds: new Set(),
      pendingJoinInviteCountByActivityId: new Map(),
    });

    expect(enriched[0].viewerAccess?.gateReason).toBe('sign_in');
    expect(enriched[0].viewerAccess?.canOpenDetailPage).toBe(true);
    expect(enriched[0].viewerAccess?.mapPeekActions?.map((a) => a.id)).toEqual([
      'request_join',
      'view_detail',
    ]);
  });

  it('attaches host mapPeekActions for activity host viewer', () => {
    const items: ExploreMapItemDTO[] = [
      {
        id: 'activity:a1',
        kind: 'hiking',
        source: 'activity',
        title: 'Hike',
        latitude: 25,
        longitude: 55,
        path: '/activity/a1',
        activity: {
          id: 'a1',
          tenantId: 't1',
          hostUserId: 'host-1',
          status: 'published',
          title: 'Hike',
          joinMode: 'open',
          requirements: [],
        } as ExploreMapItemDTO['activity'],
      },
    ];

    const enriched = attachExploreMapViewerAccess(items, {
      viewerUserId: 'host-1',
      isPlatformAdmin: false,
      participantActivityIds: new Set(),
      requestStatusByActivityId: new Map(),
      staffTenantIds: new Set(),
      demandJoinStatusByIntentId: new Map(),
      hostStatus: null,
      buddyUserIds: new Set(),
      pendingJoinInviteCountByActivityId: new Map(),
    });

    expect(enriched[0].viewerAccess?.level).toBe('host');
    expect(enriched[0].viewerAccess?.mapPeekActions?.map((a) => a.id)).toEqual([
      'share_activity',
      'manage_activity',
      'view_detail',
    ]);
    expect(enriched[0].viewerAccess?.entitlements?.canAddLinkedRide).toBe(false);
  });

  it('attaches pending join-invite count on mapPeekStrips for host', () => {
    const enriched = attachExploreMapViewerAccess([openActivityItem()], {
      viewerUserId: 'host-1',
      isPlatformAdmin: false,
      participantActivityIds: new Set(),
      requestStatusByActivityId: new Map(),
      staffTenantIds: new Set(),
      demandJoinStatusByIntentId: new Map(),
      hostStatus: null,
      buddyUserIds: new Set(),
      pendingJoinInviteCountByActivityId: new Map([['a1', 2]]),
    });

    expect(enriched[0].viewerAccess?.mapPeekStrips?.pendingJoinInviteCount).toBe(2);
  });

  it('attaches host message-first peek actions when joiners are on the map row', () => {
    const items: ExploreMapItemDTO[] = [
      {
        id: 'activity:a1',
        kind: 'hiking',
        source: 'activity',
        title: 'Hike',
        latitude: 25,
        longitude: 55,
        path: '/activity/a1',
        participantPreviews: [{ id: 'p1', name: 'Alex', avatar: null }],
        activity: {
          id: 'a1',
          tenantId: 't1',
          hostUserId: 'host-1',
          status: 'published',
          title: 'Hike',
          joinMode: 'open',
          requirements: [],
        } as ExploreMapItemDTO['activity'],
      },
    ];

    const enriched = attachExploreMapViewerAccess(items, {
      viewerUserId: 'host-1',
      isPlatformAdmin: false,
      participantActivityIds: new Set(),
      requestStatusByActivityId: new Map(),
      staffTenantIds: new Set(),
      demandJoinStatusByIntentId: new Map(),
      hostStatus: null,
      buddyUserIds: new Set(),
      pendingJoinInviteCountByActivityId: new Map(),
    });

    expect(enriched[0].viewerAccess?.mapPeekActions?.map((a) => a.id)).toEqual([
      'open_crew_chat',
      'share_activity',
      'manage_activity',
      'view_detail',
    ]);
  });

  it('attaches participant mapPeekActions for approved roster viewer', () => {
    const items: ExploreMapItemDTO[] = [
      {
        id: 'activity:a1',
        kind: 'hiking',
        source: 'activity',
        title: 'Hike',
        latitude: 25,
        longitude: 55,
        path: '/activity/a1',
        activity: {
          id: 'a1',
          tenantId: 't1',
          hostUserId: 'host-1',
          status: 'published',
          title: 'Hike',
          joinMode: 'open',
          requirements: [],
        } as ExploreMapItemDTO['activity'],
      },
    ];

    const enriched = attachExploreMapViewerAccess(items, {
      viewerUserId: 'member-1',
      isPlatformAdmin: false,
      participantActivityIds: new Set(['a1']),
      requestStatusByActivityId: new Map(),
      staffTenantIds: new Set(),
      demandJoinStatusByIntentId: new Map(),
      hostStatus: null,
      buddyUserIds: new Set(),
      pendingJoinInviteCountByActivityId: new Map(),
    });

    expect(enriched[0].viewerAccess?.level).toBe('participant');
    expect(enriched[0].viewerAccess?.mapPeekActions?.map((a) => a.id)).toEqual([
      'open_crew_chat',
      'invite_crew',
      'withdraw_join',
      'view_detail',
    ]);
    expect(enriched[0].viewerAccess?.mapPeekStrips?.showJoinedStatusChipOnPeek).toBe(true);
    expect(enriched[0].viewerAccess?.mapPeekStrips?.maskRosterToFriendsOnly).toBe(true);
  });

  it('attaches request_join for signed-in non-roster member', () => {
    const enriched = attachExploreMapViewerAccess([openActivityItem()], {
      viewerUserId: 'member-1',
      isPlatformAdmin: false,
      participantActivityIds: new Set(),
      requestStatusByActivityId: new Map(),
      staffTenantIds: new Set(),
      demandJoinStatusByIntentId: new Map(),
      hostStatus: null,
      buddyUserIds: new Set(),
      pendingJoinInviteCountByActivityId: new Map(),
    });

    expect(enriched[0].viewerAccess?.level).toBe('link_holder');
    expect(enriched[0].viewerAccess?.mapPeekActions?.map((a) => a.id)).toEqual([
      'request_join',
      'view_detail',
    ]);
  });

  it('attaches pending_join for pending join request', () => {
    const enriched = attachExploreMapViewerAccess([openActivityItem()], {
      viewerUserId: 'member-1',
      isPlatformAdmin: false,
      participantActivityIds: new Set(),
      requestStatusByActivityId: new Map([['a1', RequestStatus.PENDING]]),
      staffTenantIds: new Set(),
      demandJoinStatusByIntentId: new Map(),
      hostStatus: null,
      buddyUserIds: new Set(),
      pendingJoinInviteCountByActivityId: new Map(),
    });

    expect(enriched[0].viewerAccess?.level).toBe('join_request');
    expect(enriched[0].viewerAccess?.mapPeekActions).toEqual([
      { id: 'pending_join', prominence: 'primary', joinRequestStatus: 'pending' },
      { id: 'withdraw_join', prominence: 'text' },
      { id: 'view_detail', prominence: 'text' },
    ]);
  });

  it('gives tenant staff view_detail only on another hosts pin', () => {
    const enriched = attachExploreMapViewerAccess([openActivityItem()], {
      viewerUserId: 'staff-1',
      isPlatformAdmin: false,
      participantActivityIds: new Set(),
      requestStatusByActivityId: new Map(),
      staffTenantIds: new Set(['t1']),
      demandJoinStatusByIntentId: new Map(),
      hostStatus: null,
      buddyUserIds: new Set(),
      pendingJoinInviteCountByActivityId: new Map(),
    });

    expect(enriched[0].viewerAccess?.level).toBe('tenant_staff');
    expect(enriched[0].viewerAccess?.mapPeekActions?.map((a) => a.id)).toEqual(['view_detail']);
  });

  it('attaches commerce viewerAccess for shop rows', () => {
    const items: ExploreMapItemDTO[] = [
      {
        id: 'shop:t1',
        kind: 'shop',
        source: 'shop',
        title: 'Gear',
        latitude: 25,
        longitude: 55,
        path: '/shop/t1',
      },
    ];

    const enriched = attachExploreMapViewerAccess(items, {
      viewerUserId: null,
      isPlatformAdmin: false,
      participantActivityIds: new Set(),
      requestStatusByActivityId: new Map(),
      staffTenantIds: new Set(),
      demandJoinStatusByIntentId: new Map(),
      hostStatus: null,
      buddyUserIds: new Set(),
      pendingJoinInviteCountByActivityId: new Map(),
    });

    expect(enriched[0].viewerAccess?.gateReason).toBe('sign_in');
  });
});
