/**
 * RF-02 / R1.4 — map peek L1 fallback should match activity detail wire for the same viewer state.
 */
import { describe, expect, it } from 'vitest';
import type { ActivityViewerAccessDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  activityIsConsumerDiscoverable,
  computeActivityViewerEntitlements,
  mapPeekJoinRequestStatusFromUiKind,
  projectActivityMapPeekActions,
  resolveActivityEngagementPolicy,
  APPROVAL_PARTICIPATION_REQUIREMENT,
  RSVP_PARTICIPATION_REQUIREMENT,
} from '@uaetrail/shared-types';
import { hostedExploreMapItem } from '../explore/exploreMapItemFixtures';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import { resolveActivityMapPeekActions } from './activityPeekEngagement';
import { resolveActivityDetailWirePresentation } from './resolveActivityDetailWirePresentation';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

const meeting = { meetingLat: 25.1, meetingLng: 55.2 };

const expectPeekMatchesDetailWire = (input: {
  item: ExploreMapItemDTO;
  viewerAccess: ActivityViewerAccessDTO;
  joinUiState: JoinRequestUiState;
  isHostUser: boolean;
  myParticipation?: unknown | null;
  myRequest?: { status: string; canWithdraw: boolean } | null;
  participants?: unknown[];
}) => {
  const baseCard = buildDiscoveryCardViewModelCard(input.item, [input.item]);
  const card = {
    ...baseCard,
    viewerAccess: { ...input.viewerAccess, mapPeekActions: undefined },
  };

  const joinedPeek =
    input.joinUiState.kind === 'confirmed' ||
    input.viewerAccess.level === 'participant' ||
    input.viewerAccess.level === 'activity_group_member';
  const peekVisible = (ids: string[]) =>
    (joinedPeek ? ids.filter((id) => id !== 'view_detail') : ids).sort();

  const peekIds = peekVisible(
    resolveActivityMapPeekActions(card, input.joinUiState).map((action) => action.id)
  );

  const activity = input.item.activity!;
  const detailPolicy = resolveActivityEngagementPolicy({
    viewerAccess: input.viewerAccess,
    isHostUser: input.isHostUser,
    activityPublished: activityIsConsumerDiscoverable(activity.status),
    participationMode: activity.participationMode,
    requirements: activity.requirements,
    joinMode: activity.joinMode,
    joinRequestStatus: mapPeekJoinRequestStatusFromUiKind(input.joinUiState),
    meetingLat: activity.meetingLat ?? null,
    meetingLng: activity.meetingLng ?? null,
    rideshareEnabled: Boolean(activity.rideshareEnabled),
    linkedRideshareActivityId: activity.linkedRideshareActivityId ?? null,
    myParticipation: input.myParticipation ?? null,
    myRequest: input.myRequest ?? null,
    confirmedParticipantCount:
      input.participants?.length ?? input.item.participantPreviews?.length ?? 0,
  });

  const level = input.viewerAccess.level ?? 'public';
  const detailPeekIds = peekVisible(
    projectActivityMapPeekActions(
      detailPolicy,
      input.viewerAccess.entitlements ?? null,
      level
    ).map((action) => action.id)
  );

  expect(peekIds).toEqual(detailPeekIds);

  const detailWire = resolveActivityDetailWirePresentation({
    activity: {
      status: activity.status ?? 'published',
      participationMode: activity.participationMode,
      requirements: activity.requirements,
      meetingLat: activity.meetingLat ?? null,
      meetingLng: activity.meetingLng ?? null,
      joinMode: activity.joinMode,
      participants: input.participants ?? [],
      rideshareEnabled: activity.rideshareEnabled ?? false,
      linkedRideshare: null,
      linkedParentActivity: null,
    },
    viewerAccess: input.viewerAccess,
    isHostUser: input.isHostUser,
    joinUiState: input.joinUiState,
    myParticipation: input.myParticipation ?? null,
    myRequest: input.myRequest ?? null,
  });
  expect(detailWire?.footerByTab.plan).toBe(detailPolicy.presentation.footerByTab.plan);
};

const approvalHikeItem = () =>
  hostedExploreMapItem({
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

describe('mapDetailEngagementParity (RF-02 / R1.4)', () => {
  it('peek fallback actions match detail wire for pre-crew public guest (AD-CTA-01:A)', () => {
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
    };

    expectPeekMatchesDetailWire({
      item: approvalHikeItem(),
      viewerAccess,
      joinUiState: { kind: 'open' },
      isHostUser: false,
    });
  });

  it('peek fallback actions match detail wire for pre-crew Pro guest (AD-CTA-01:B)', () => {
    const entitlements = computeActivityViewerEntitlements({
      isProMember: true,
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
    };

    expectPeekMatchesDetailWire({
      item: approvalHikeItem(),
      viewerAccess,
      joinUiState: { kind: 'open' },
      isHostUser: false,
    });
  });

  it('peek fallback actions match detail wire for guest pending join', () => {
    const entitlements = computeActivityViewerEntitlements({
      isProMember: false,
      isFriendOfHost: false,
      level: 'join_request',
      canAccessCrewSurfaces: false,
      friendUserIdsOnActivity: [],
    });
    const viewerAccess: ActivityViewerAccessDTO = {
      exposure: 'full',
      level: 'join_request',
      gateReason: null,
      canOpenDetailPage: true,
      canAccessCrewSurfaces: false,
      entitlements,
    };

    const item = hostedExploreMapItem({
      activity: {
        id: 'act-parity',
        title: 'Parity hike',
        activityType: 'hiking',
        status: 'published',
        participationMode: 'approval',
        ...meeting,
        requirements: [APPROVAL_PARTICIPATION_REQUIREMENT],
        joinMode: 'open',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);

    expectPeekMatchesDetailWire({
      item,
      viewerAccess,
      joinUiState: { kind: 'pending', requestId: 'req-1', status: 'pending' },
      isHostUser: false,
      myRequest: { status: 'pending', canWithdraw: true },
    });
  });

  it('peek fallback actions match detail wire for RSVP participant in crew', () => {
    const entitlements = computeActivityViewerEntitlements({
      isProMember: true,
      isFriendOfHost: false,
      level: 'participant',
      canAccessCrewSurfaces: true,
      friendUserIdsOnActivity: [],
    });
    const viewerAccess: ActivityViewerAccessDTO = {
      exposure: 'full',
      level: 'participant',
      gateReason: null,
      canOpenDetailPage: true,
      canAccessCrewSurfaces: true,
      entitlements,
    };

    const item = hostedExploreMapItem({
      participantPreviews: [{ id: 'p1', name: 'You' }],
      activity: {
        id: 'act-rsvp',
        title: 'Friday run',
        activityType: 'event',
        status: 'published',
        participationMode: 'rsvp',
        ...meeting,
        requirements: [RSVP_PARTICIPATION_REQUIREMENT],
        joinMode: 'open',
        rideshareEnabled: true,
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);

    expectPeekMatchesDetailWire({
      item,
      viewerAccess,
      joinUiState: { kind: 'confirmed', requestId: 'req-rsvp' },
      isHostUser: false,
      myParticipation: { participantId: 'p1' },
      participants: [{ id: 'p1' }],
    });
  });

  it('peek fallback actions match detail wire for host before joiners (AD-CTA-01:D)', () => {
    const entitlements = computeActivityViewerEntitlements({
      isProMember: true,
      isFriendOfHost: false,
      level: 'host',
      canAccessCrewSurfaces: true,
      friendUserIdsOnActivity: [],
    });
    const viewerAccess: ActivityViewerAccessDTO = {
      exposure: 'full',
      level: 'host',
      gateReason: null,
      canOpenDetailPage: true,
      canAccessCrewSurfaces: true,
      entitlements,
    };

    const item = hostedExploreMapItem({
      activity: {
        id: 'act-host-empty',
        title: 'Empty host plan',
        activityType: 'hiking',
        status: 'published',
        participationMode: 'rsvp',
        ...meeting,
        requirements: [RSVP_PARTICIPATION_REQUIREMENT],
        joinMode: 'open',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);

    expectPeekMatchesDetailWire({
      item,
      viewerAccess,
      joinUiState: { kind: 'open' },
      isHostUser: true,
      participants: [],
    });
  });

  it('peek fallback actions match detail wire for host with joiners', () => {
    const entitlements = computeActivityViewerEntitlements({
      isProMember: true,
      isFriendOfHost: false,
      level: 'host',
      canAccessCrewSurfaces: true,
      friendUserIdsOnActivity: ['u-joiner'],
    });
    const viewerAccess: ActivityViewerAccessDTO = {
      exposure: 'full',
      level: 'host',
      gateReason: null,
      canOpenDetailPage: true,
      canAccessCrewSurfaces: true,
      entitlements,
    };

    const item = hostedExploreMapItem({
      participantPreviews: [{ id: 'u-joiner', name: 'Alex' }, { id: 'u-2', name: 'Sam' }],
      activity: {
        id: 'act-host',
        title: 'Host outing',
        activityType: 'hiking',
        status: 'published',
        participationMode: 'rsvp',
        ...meeting,
        requirements: [RSVP_PARTICIPATION_REQUIREMENT],
        joinMode: 'open',
      },
    } as Parameters<typeof hostedExploreMapItem>[0]);

    expectPeekMatchesDetailWire({
      item,
      viewerAccess,
      joinUiState: { kind: 'open' },
      isHostUser: true,
      participants: [{ id: 'u-joiner' }, { id: 'u-2' }],
    });
  });
});
