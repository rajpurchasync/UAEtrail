import type { ActivityViewerAccessDTO } from './activity-viewer-access.js';
import type { ParticipationMode } from './activity-participation-mode.js';
import { resolveParticipationMode } from './activity-participation-mode.js';
import { resolveActivityJoinEngagementKind } from './activity-join-engagement.js';
import {
  ACTIVITY_DETAIL_TAB_IDS,
  type ActivityDetailTabFooterKind,
  type ActivityDetailTabId,
  resolveActivityDetailTabFooterKind,
} from './activity-detail-tab-footers.js';
import type { ActivityEngagementStripsDTO } from './activity-engagement-policy.js';

const TRANSPORT_REQUIREMENT_PATTERN = /^(Reachable by|Vehicle:)/i;

const countTransportReachLines = (requirements?: string[] | null): number => {
  if (!requirements?.length) return 0;
  return requirements.filter((line) => TRANSPORT_REQUIREMENT_PATTERN.test(line.trim())).length;
};

export type ActivityPresentationEngagementDTO = {
  participationMode: ParticipationMode;
  canAccessCrewSurfaces: boolean;
  showParticipantFooterShortcuts: boolean;
  showCrewWelcomeAfterInstantJoin: boolean;
  showCrewLockedHint: boolean;
  joinEngagement: 'open' | 'pending' | 'confirmed';
};

export type ActivityPresentationPlanTabDTO = {
  /** Consumer mobile tabs hide the Plan date/time grid when true. */
  useTabChrome: boolean;
  showTransportTeaser: boolean;
};

export type ActivityPresentationPlaceTabDTO = {
  showLockedPlaceholder: boolean;
  showCrewMapAndMeeting: boolean;
  hasDirections: boolean;
};

export type ActivityPresentationBuddiesTabDTO = {
  showCrewLockedHint: boolean;
  showParticipantShortcuts: boolean;
  showHostManageHub: boolean;
};

export type ActivityPresentationTransportTabDTO = {
  reachByLineCount: number;
  linkedRideshareActivityId: string | null;
  showLinkedRide: boolean;
  showParticipantEmptyEncouragement: boolean;
};

export type ActivityPresentationTabsDTO = {
  plan: ActivityPresentationPlanTabDTO;
  place: ActivityPresentationPlaceTabDTO;
  buddies: ActivityPresentationBuddiesTabDTO;
  transport: ActivityPresentationTransportTabDTO;
};

/** Public `/activity/:id` scroll template slots — built with tabs in one pass (embed uses `tabs` + `footerByTab`). */
export type ActivityPresentationConsumerLayoutDTO = {
  showPublishedCatalog: boolean;
  showHostProfile: boolean;
  participants: 'hidden' | 'preview' | 'roster';
  showMeetingPoint: boolean;
  showTransportSection: boolean;
  showHostManageHub: boolean;
  canOpenParticipantRoster: boolean;
};

export type ActivityPresentationDTO = {
  engagement: ActivityPresentationEngagementDTO;
  tabs: ActivityPresentationTabsDTO;
  footerByTab: Record<ActivityDetailTabId, ActivityDetailTabFooterKind>;
  /** Scroll consumer page only (`!previewMode && !isEmbedded && published`). */
  consumerLayout?: ActivityPresentationConsumerLayoutDTO;
  /** Peek-parity strip flags (detail hero invited chip, etc.). */
  strips?: ActivityEngagementStripsDTO;
};

export type BuildActivityPresentationInput = {
  viewerAccess: ActivityViewerAccessDTO | null;
  isHostUser: boolean;
  previewMode?: boolean;
  isEmbedded?: boolean;
  activityPublished: boolean;
  participationMode?: ParticipationMode | null;
  requirements?: string[] | null;
  meetingLat?: number | null;
  meetingLng?: number | null;
  startLat?: number | null;
  startLng?: number | null;
  parkingLat?: number | null;
  parkingLng?: number | null;
  rideshareEnabled?: boolean;
  linkedRideshareActivityId?: string | null;
  myParticipation?: unknown | null;
  myRequest?: { status: string; canWithdraw: boolean } | null;
  /** Confirmed roster size — host peek Message when > 0 (§6.2 bucket E). */
  confirmedParticipantCount?: number;
  /** Masked roster previews on public detail (policy-gated). */
  participantPreviewCount?: number;
  /** Pending Join me invites from the viewer for this activity (map peek invited chip). */
  pendingJoinInviteCount?: number;
};

const hasMeetingCoordinates = (input: BuildActivityPresentationInput): boolean => {
  const lat =
    input.startLat ?? input.meetingLat ?? input.parkingLat ?? null;
  const lng =
    input.startLng ?? input.meetingLng ?? input.parkingLng ?? null;
  return lat != null && lng != null;
};

export const buildActivityPresentationDTO = (
  input: BuildActivityPresentationInput
): ActivityPresentationDTO => {
  const participationMode = resolveParticipationMode(input.participationMode, input.requirements);
  const canAccessCrewSurfaces = input.viewerAccess?.canAccessCrewSurfaces ?? false;
  const joinEngagement = resolveActivityJoinEngagementKind({
    hasParticipation: Boolean(input.myParticipation),
    myRequest: input.myRequest,
  });

  const isConfirmedParticipant = joinEngagement === 'confirmed';
  const showParticipantFooterShortcuts =
    canAccessCrewSurfaces && isConfirmedParticipant && !input.isHostUser;

  const showCrewWelcomeAfterInstantJoin =
    participationMode === 'rsvp' && canAccessCrewSurfaces;

  const showCrewLockedHint =
    !canAccessCrewSurfaces &&
    !input.isHostUser &&
    (joinEngagement === 'open' ||
      joinEngagement === 'pending' ||
      input.viewerAccess?.level === 'public');

  const previewMode = input.previewMode ?? false;
  const isEmbedded = input.isEmbedded ?? false;
  const useTabChrome = input.activityPublished && !previewMode && !isEmbedded;
  const coordinates = hasMeetingCoordinates(input);
  const linkedRideshareId = input.linkedRideshareActivityId ?? null;
  const rideshareEnabled = Boolean(input.rideshareEnabled);
  const reachByLineCount = countTransportReachLines(input.requirements);

  const footerInputBase = {
    isHostUser: input.isHostUser,
    isEmbedded,
    previewMode,
    canAccessCrewSurfaces,
    joinEngagement,
    hasMeetingCoordinates: coordinates,
    linkedRideshareId,
    rideshareEnabled,
    showParticipantFooterShortcuts,
  };

  const footerByTab = ACTIVITY_DETAIL_TAB_IDS.reduce(
    (acc, tab) => {
      acc[tab] = resolveActivityDetailTabFooterKind({ ...footerInputBase, tab });
      return acc;
    },
    {} as Record<ActivityDetailTabId, ActivityDetailTabFooterKind>
  );

  const placeTab = {
    showLockedPlaceholder: useTabChrome && !canAccessCrewSurfaces,
    showCrewMapAndMeeting: canAccessCrewSurfaces,
    hasDirections: coordinates,
  };
  const transportTab = {
    reachByLineCount,
    linkedRideshareActivityId: linkedRideshareId,
    showLinkedRide: Boolean(linkedRideshareId) || rideshareEnabled,
    showParticipantEmptyEncouragement:
      useTabChrome && !input.isHostUser && !linkedRideshareId && !rideshareEnabled,
  };

  const consumerScrollPage = useTabChrome;
  const rosterCount = input.confirmedParticipantCount ?? 0;
  const previewCount = input.participantPreviewCount ?? 0;
  const showParticipantsRoster =
    canAccessCrewSurfaces && (isConfirmedParticipant || input.isHostUser);
  let participantsSlot: ActivityPresentationConsumerLayoutDTO['participants'] = 'hidden';
  if (showParticipantsRoster) {
    participantsSlot = 'roster';
  } else if (previewCount > 0 || rosterCount > 0) {
    participantsSlot = 'preview';
  }

  const consumerLayout: ActivityPresentationConsumerLayoutDTO | undefined = consumerScrollPage
    ? {
        showPublishedCatalog: input.activityPublished,
        showHostProfile: input.activityPublished,
        participants: participantsSlot,
        showMeetingPoint: placeTab.showCrewMapAndMeeting,
        showTransportSection:
          transportTab.reachByLineCount > 0 ||
          transportTab.showLinkedRide ||
          coordinates,
        showHostManageHub: input.isHostUser,
        canOpenParticipantRoster:
          canAccessCrewSurfaces || input.isHostUser || isConfirmedParticipant,
      }
    : undefined;

  return {
    engagement: {
      participationMode,
      canAccessCrewSurfaces,
      showParticipantFooterShortcuts,
      showCrewWelcomeAfterInstantJoin,
      showCrewLockedHint,
      joinEngagement,
    },
    tabs: {
      plan: {
        useTabChrome,
        showTransportTeaser: useTabChrome,
      },
      place: placeTab,
      buddies: {
        showCrewLockedHint: showCrewLockedHint && useTabChrome,
        showParticipantShortcuts: showParticipantFooterShortcuts,
        showHostManageHub: input.isHostUser && useTabChrome,
      },
      transport: transportTab,
    },
    footerByTab,
    consumerLayout,
  };
};
