import type { ActivityJoinMode } from './activity-join-mode.js';
import type { ActivityMapPeekAction } from './activity-map-peek-actions.js';
import type { ActivityEngagementStripsDTO } from './activity-engagement-policy.js';
import type { ActivityViewerEntitlementsDTO } from './activity-viewer-entitlements.js';
import {
  canWithdrawJoinRequestStatus,
  resolveActivityJoinEngagementPhase,
  type ActivityJoinEngagementSnapshot,
} from './activity-join-engagement.js';

/** Payload depth for activity detail / peek surfaces. */
export type DetailExposure = 'full' | 'redacted' | 'none';

/**
 * UI prompt when the viewer cannot see full detail (not authorization by itself).
 * `profile_required` / `upgrade_required` — member capabilities & paid tiers (`member-access.ts`).
 */
export type ViewerGateReason =
  | 'sign_in'
  | 'profile_required'
  | 'join_required'
  | 'upgrade_required'
  | 'invite_only';

export type ActivityViewerAccessLevel =
  | 'platform_admin'
  | 'host'
  /** Publishing-tenant team member — full detail when entitled; not the activity host user (no host peek CTAs). */
  | 'tenant_staff'
  | 'participant'
  | 'join_request'
  | 'activity_group_member'
  | 'link_holder'
  | 'public'
  | 'denied';

export type ActivityViewerAccessDTO = {
  exposure: DetailExposure;
  level: ActivityViewerAccessLevel;
  gateReason: ViewerGateReason | null;
  /** Legacy alias — `exposure === 'full'`. */
  canViewFullActivity: boolean;
  canOpenDetailPage: boolean;
  joinMode: ActivityJoinMode;
  /** Meeting point, crew chat, full itinerary — host or confirmed participant only. */
  canAccessCrewSurfaces: boolean;
  /** Explore map peek footer — guest on `GET /explore/map`; member overlay on `GET /me/discover/overlay`. */
  mapPeekActions?: ActivityMapPeekAction[];
  /** Explore map peek Participants + Logistics strips — guest map + member overlay. */
  mapPeekStrips?: ActivityEngagementStripsDTO;
  /** Layer 7 — Pro / friend social depth (not crew surfaces). */
  entitlements?: ActivityViewerEntitlementsDTO;
};

const ROSTER_FULL_LEVELS: ReadonlySet<ActivityViewerAccessLevel> = new Set([
  'platform_admin',
  'host',
  'tenant_staff',
  'participant',
]);

const CREW_SURFACES_LEVELS: ReadonlySet<ActivityViewerAccessLevel> = ROSTER_FULL_LEVELS;

/** Whether this access level may receive the full activity detail payload. */
export const activityViewerLevelHasFullDetail = (level: ActivityViewerAccessLevel): boolean =>
  ROSTER_FULL_LEVELS.has(level);

export const activityViewerLevelCanAccessCrewSurfaces = (
  level: ActivityViewerAccessLevel
): boolean => CREW_SURFACES_LEVELS.has(level);

/**
 * Roster-adjacent viewer levels from the join engagement snapshot.
 * Host / staff / invite / group stay outside this projection — do not merge enums.
 * `join_request` here is in-flight pending/waitlisted only; approved is `participant`.
 */
export const activityViewerLevelFromJoinEngagement = (
  snapshot: ActivityJoinEngagementSnapshot
): Extract<ActivityViewerAccessLevel, 'participant' | 'join_request'> | null => {
  const phase = resolveActivityJoinEngagementPhase(snapshot);
  if (phase.kind === 'confirmed') return 'participant';
  if (phase.kind === 'pending') return 'join_request';
  return null;
};

/** Map/detail batch facts → join snapshot for {@link activityViewerLevelFromJoinEngagement}. */
export const activityJoinEngagementSnapshotFromViewerFacts = (input: {
  hasParticipation?: boolean;
  requestStatus?: string | null;
  requestId?: string;
}): ActivityJoinEngagementSnapshot => {
  const status = input.requestStatus?.trim();
  return {
    hasParticipation: input.hasParticipation,
    myRequest: status
      ? {
          id: input.requestId,
          status,
          canWithdraw: canWithdrawJoinRequestStatus(status),
        }
      : null,
  };
};

/**
 * Social/roster policy for activity detail exposure (layers 3 + 5 → 6).
 * Not for Pro membership, host publish tiers, or platform admin — compose those
 * in the API resolver pipeline (docs/DOMAIN_CANONICALS.md §15.10).
 */
export const computeActivityDetailExposure = (input: {
  joinMode: ActivityJoinMode;
  level: ActivityViewerAccessLevel;
  viewerUserId: string | null;
}): ActivityViewerAccessDTO => {
  const { joinMode, level, viewerUserId } = input;
  const canAccessCrewSurfaces = activityViewerLevelCanAccessCrewSurfaces(level);

  if (level === 'denied' || (joinMode === 'private' && !viewerUserId)) {
    return {
      exposure: 'none',
      level: level === 'denied' ? 'denied' : level,
      gateReason: 'invite_only',
      canViewFullActivity: false,
      canOpenDetailPage: false,
      joinMode,
      canAccessCrewSurfaces: false,
    };
  }

  if (level === 'join_request' || level === 'activity_group_member') {
    return {
      exposure: 'redacted',
      level,
      gateReason: null,
      canViewFullActivity: false,
      canOpenDetailPage: true,
      joinMode,
      canAccessCrewSurfaces: false,
    };
  }

  if (activityViewerLevelHasFullDetail(level)) {
    return {
      exposure: 'full',
      level,
      gateReason: null,
      canViewFullActivity: true,
      canOpenDetailPage: true,
      joinMode,
      canAccessCrewSurfaces,
    };
  }

  if (!viewerUserId) {
    return {
      exposure: 'none',
      level,
      gateReason: 'sign_in',
      canViewFullActivity: false,
      canOpenDetailPage: false,
      joinMode,
      canAccessCrewSurfaces: false,
    };
  }

  if (joinMode === 'private') {
    return {
      exposure: 'none',
      level: 'denied',
      gateReason: 'invite_only',
      canViewFullActivity: false,
      canOpenDetailPage: false,
      joinMode,
      canAccessCrewSurfaces: false,
    };
  }

  return {
    exposure: 'redacted',
    level,
    gateReason: 'join_required',
    canViewFullActivity: false,
    canOpenDetailPage: true,
    joinMode,
    canAccessCrewSurfaces: false,
  };
};
