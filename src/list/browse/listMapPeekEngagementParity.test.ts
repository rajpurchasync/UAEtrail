/**
 * List feed + map peek share L1 engagement (`resolveActivityPeekEngagement`, card `primaryCta`, status chips).
 */
import { describe, expect, it } from 'vitest';
import {
  APPROVAL_PARTICIPATION_REQUIREMENT,
  RSVP_PARTICIPATION_REQUIREMENT,
  computeActivityViewerEntitlements,
  pickActivityPeekTwoSlotActions,
  projectActivityMapPeekActions,
  resolveActivityEngagementPolicy,
  type ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../discovery';
import { hostedExploreMapItem } from '../../explore/exploreMapItemFixtures';
import { resolveActivityMapPeekActions } from '../../activity/activityPeekEngagement';
import { resolveListFeedFooterModel } from './listFeedFooterActions';
import { ACTIVITY_CTA_OPEN_CHAT, ACTIVITY_PEEK_MANAGE_LABEL } from '../../content/activityParticipationCopy';
import { activityMapPeekActionLabel } from '../../explore/exploreMapPeekActionCopy';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';

const meeting = { meetingLat: 25.1, meetingLng: 55.2 };

const withWire = (
  item: ReturnType<typeof hostedExploreMapItem>,
  viewerAccess: ActivityViewerAccessDTO,
  joinUiState?: JoinRequestUiState
) => {
  const card = {
    ...buildDiscoveryCardViewModelCard(item),
    viewerAccess,
    showJoinActions: true,
  };
  const listFooter = resolveListFeedFooterModel(card, { isGuest: false, joinUiState });
  const peekActions = resolveActivityMapPeekActions(card, joinUiState);
  const peekPrimary = peekActions.find((a) => a.prominence === 'primary');
  return { card, listFooter, peekActions, peekPrimary };
};

describe('listMapPeekEngagementParity', () => {
  it('approval host setting → Request to join on card + wire primary', () => {
    const item = hostedExploreMapItem({
      activity: {
        id: 'act-approval',
        title: 'Approval hike',
        activityType: 'hiking',
        status: 'published',
        participationMode: 'approval',
        ...meeting,
        requirements: [APPROVAL_PARTICIPATION_REQUIREMENT],
        joinMode: 'open',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);
    const entitlements = computeActivityViewerEntitlements({
      isProMember: false,
      isFriendOfHost: false,
      level: 'public',
      canAccessCrewSurfaces: false,
      friendUserIdsOnActivity: [],
    });
    const viewerAccess: ActivityViewerAccessDTO = {
      exposure: 'redacted',
      level: 'public',
      gateReason: null,
      canOpenDetailPage: true,
      canAccessCrewSurfaces: false,
      entitlements,
      mapPeekActions: projectActivityMapPeekActions(
        resolveActivityEngagementPolicy({
          viewerAccess: {
            exposure: 'redacted',
            level: 'public',
            gateReason: null,
            canOpenDetailPage: true,
            canAccessCrewSurfaces: false,
            entitlements,
          },
          isHostUser: false,
          activityPublished: true,
          participationMode: 'approval',
          requirements: [APPROVAL_PARTICIPATION_REQUIREMENT],
          myParticipation: null,
          myRequest: null,
          ...meeting,
        }),
        entitlements,
        'public'
      ),
    };
    const { card, listFooter, peekPrimary } = withWire(item, viewerAccess);
    expect(card.primaryCta).toBe('Request to join');
    expect(peekPrimary?.id).toBe('request_join');
    expect(listFooter.primary).toMatchObject({ kind: 'action', actionId: 'request_join' });
    expect(listFooter.secondary).toMatchObject({ kind: 'link' });
  });

  it('RSVP host setting → I\'m going on card + wire primary', () => {
    const item = hostedExploreMapItem({
      activity: {
        id: 'act-rsvp',
        title: 'Sunrise run',
        activityType: 'event',
        status: 'published',
        participationMode: 'rsvp',
        ...meeting,
        requirements: [RSVP_PARTICIPATION_REQUIREMENT],
        joinMode: 'open',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);
    const entitlements = computeActivityViewerEntitlements({
      isProMember: false,
      isFriendOfHost: false,
      level: 'public',
      canAccessCrewSurfaces: false,
      friendUserIdsOnActivity: [],
    });
    const viewerAccess: ActivityViewerAccessDTO = {
      exposure: 'redacted',
      level: 'public',
      gateReason: null,
      canOpenDetailPage: true,
      canAccessCrewSurfaces: false,
      entitlements,
      mapPeekActions: [
        { id: 'request_join', prominence: 'primary' },
        { id: 'view_detail', prominence: 'text' },
      ],
    };
    const { card, listFooter } = withWire(item, viewerAccess);
    expect(card.primaryCta).toBe("I'm going");
    expect(listFooter.primary).toMatchObject({
      kind: 'action',
      actionId: 'request_join',
      label: "I'm going",
    });
  });

  it('pending approval → disabled primary + pending label (list matches peek wire)', () => {
    const item = hostedExploreMapItem({
      activity: {
        id: 'act-pending',
        title: 'Pending hike',
        activityType: 'hiking',
        status: 'published',
        participationMode: 'approval',
        ...meeting,
        requirements: [APPROVAL_PARTICIPATION_REQUIREMENT],
        joinMode: 'open',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);
    const joinUi: JoinRequestUiState = {
      kind: 'pending',
      requestId: 'req-1',
      status: 'pending',
    };
    const viewerAccess: ActivityViewerAccessDTO = {
      exposure: 'full',
      level: 'join_request',
      gateReason: null,
      canOpenDetailPage: true,
      canAccessCrewSurfaces: false,
      mapPeekActions: [
        { id: 'request_join', prominence: 'primary' },
        { id: 'view_detail', prominence: 'text' },
      ],
    };
    const { listFooter, peekPrimary } = withWire(item, viewerAccess, joinUi);
    expect(peekPrimary?.id).toBe('pending_join');
    expect(listFooter.primary).toMatchObject({ kind: 'disabled' });
    expect(listFooter.primary).toMatchObject({
      label: activityMapPeekActionLabel('pending_join', peekPrimary),
    });
  });

  it('joined participant → Open chat primary on list and peek', () => {
    const item = hostedExploreMapItem({
      participantPreviews: [{ id: 'p1', name: 'You' }],
      activity: {
        id: 'act-joined',
        title: 'Friday run',
        activityType: 'event',
        status: 'published',
        participationMode: 'rsvp',
        ...meeting,
        requirements: [RSVP_PARTICIPATION_REQUIREMENT],
        joinMode: 'open',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);
    const joinUi: JoinRequestUiState = { kind: 'confirmed', requestId: 'req-rsvp' };
    const viewerAccess: ActivityViewerAccessDTO = {
      exposure: 'full',
      level: 'participant',
      gateReason: null,
      canOpenDetailPage: true,
      canAccessCrewSurfaces: true,
      mapPeekActions: [
        { id: 'open_crew_chat', prominence: 'primary' },
        { id: 'invite_crew', prominence: 'secondary' },
        { id: 'view_detail', prominence: 'text' },
      ],
    };
    const { listFooter, peekPrimary } = withWire(item, viewerAccess, joinUi);
    expect(peekPrimary?.id).toBe('open_crew_chat');
    expect(listFooter.primary).toMatchObject({
      kind: 'action',
      actionId: 'open_crew_chat',
      label: ACTIVITY_CTA_OPEN_CHAT,
    });
  });

  it('joined participant — list footer tracks wire without client join context', () => {
    const item = hostedExploreMapItem({
      participantPreviews: [{ id: 'p1', name: 'You' }],
      activity: {
        id: 'act-joined-wire',
        title: 'Run',
        activityType: 'event',
        status: 'published',
        participationMode: 'rsvp',
        ...meeting,
        joinMode: 'open',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);
    const viewerAccess: ActivityViewerAccessDTO = {
      exposure: 'full',
      level: 'participant',
      gateReason: null,
      canOpenDetailPage: true,
      canAccessCrewSurfaces: true,
      mapPeekActions: [
        { id: 'open_crew_chat', prominence: 'primary' },
        { id: 'invite_crew', prominence: 'secondary' },
        { id: 'withdraw_join', prominence: 'link' },
        { id: 'offer_rideshare', prominence: 'link' },
        { id: 'view_detail', prominence: 'text' },
      ],
    };
    const { listFooter } = withWire(item, viewerAccess, undefined);
    expect(listFooter.primary).toMatchObject({ actionId: 'open_crew_chat' });
    expect(listFooter.secondary).toMatchObject({ actionId: 'invite_crew' });
  });

  it('host without joiners → share + manage on list matches two-slot wire', () => {
    const item = hostedExploreMapItem({
      participantPreviews: [],
      activity: {
        id: 'act-host-empty',
        title: 'Host hike',
        activityType: 'hiking',
        status: 'published',
        hostUserId: 'host-me',
        participationMode: 'rsvp',
        ...meeting,
        joinMode: 'open',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);
    const entitlements = computeActivityViewerEntitlements({
      isProMember: true,
      isFriendOfHost: false,
      level: 'host',
      canAccessCrewSurfaces: true,
      friendUserIdsOnActivity: [],
    });
    const policy = resolveActivityEngagementPolicy({
      ...meeting,
      viewerAccess: {
        exposure: 'full',
        level: 'host',
        gateReason: null,
        canOpenDetailPage: true,
        canAccessCrewSurfaces: true,
        entitlements,
      },
      isHostUser: true,
      activityPublished: true,
      participationMode: 'rsvp',
      requirements: [RSVP_PARTICIPATION_REQUIREMENT],
      myParticipation: null,
      myRequest: null,
      confirmedParticipantCount: 0,
    });
    const mapPeekActions = projectActivityMapPeekActions(policy, entitlements, 'host');
    const viewerAccess: ActivityViewerAccessDTO = {
      exposure: 'full',
      level: 'host',
      gateReason: null,
      canOpenDetailPage: true,
      canAccessCrewSurfaces: true,
      entitlements,
      mapPeekActions,
    };
    const card = {
      ...buildDiscoveryCardViewModelCard(item),
      viewerAccess,
      showJoinActions: false,
    };
    const twoSlot = pickActivityPeekTwoSlotActions(mapPeekActions);
    const listFooter = resolveListFeedFooterModel(card, { isGuest: false });
    expect(twoSlot.primary?.id).toBe('share_activity');
    expect(twoSlot.secondary?.id).toBe('manage_activity');
    expect(listFooter.primary).toMatchObject({ actionId: 'share_activity' });
    expect(listFooter.secondary).toMatchObject({
      actionId: 'manage_activity',
      label: ACTIVITY_PEEK_MANAGE_LABEL,
    });
  });

  it('host with joiners → chat + share on list (manage on detail only)', () => {
    const item = hostedExploreMapItem({
      participantPreviews: [{ id: 'p1', name: 'Alex' }],
      activity: {
        id: 'act-host-crew',
        title: 'Crew hike',
        activityType: 'hiking',
        status: 'published',
        hostUserId: 'host-me',
        participationMode: 'rsvp',
        ...meeting,
        joinMode: 'open',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);
    const entitlements = computeActivityViewerEntitlements({
      isProMember: true,
      isFriendOfHost: false,
      level: 'host',
      canAccessCrewSurfaces: true,
      friendUserIdsOnActivity: ['p1'],
    });
    const policy = resolveActivityEngagementPolicy({
      ...meeting,
      viewerAccess: {
        exposure: 'full',
        level: 'host',
        gateReason: null,
        canOpenDetailPage: true,
        canAccessCrewSurfaces: true,
        entitlements,
      },
      isHostUser: true,
      activityPublished: true,
      participationMode: 'rsvp',
      requirements: [RSVP_PARTICIPATION_REQUIREMENT],
      myParticipation: null,
      myRequest: null,
      confirmedParticipantCount: 2,
    });
    const mapPeekActions = projectActivityMapPeekActions(policy, entitlements, 'host');
    const viewerAccess: ActivityViewerAccessDTO = {
      exposure: 'full',
      level: 'host',
      gateReason: null,
      canOpenDetailPage: true,
      canAccessCrewSurfaces: true,
      entitlements,
      mapPeekActions,
    };
    const card = {
      ...buildDiscoveryCardViewModelCard(item),
      viewerAccess,
      showJoinActions: false,
    };
    const listFooter = resolveListFeedFooterModel(card, { isGuest: false });
    const peekActions = resolveActivityMapPeekActions(card);
    const twoSlot = pickActivityPeekTwoSlotActions(peekActions);
    expect(twoSlot.primary?.id).toBe('open_crew_chat');
    expect(twoSlot.secondary?.id).toBe('share_activity');
    expect(listFooter.primary).toMatchObject({
      actionId: 'open_crew_chat',
      label: ACTIVITY_CTA_OPEN_CHAT,
    });
    expect(listFooter.secondary).toMatchObject({ actionId: 'share_activity' });
    expect(listFooter.secondary).not.toMatchObject({ actionId: 'manage_activity' });
  });
});