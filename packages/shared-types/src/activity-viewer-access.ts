import type { ActivityJoinMode } from './activity-join-mode.js';
import type { ActivityMapPeekAction } from './activity-map-peek-actions.js';

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
  /** Explore map peek footer — set on `GET /explore/map` activity rows only. */
  mapPeekActions?: ActivityMapPeekAction[];
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

  if (joinMode === 'private') {
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
    return {
      exposure: 'redacted',
      level,
      gateReason: 'join_required',
      canViewFullActivity: false,
      canOpenDetailPage: true,
      joinMode,
      canAccessCrewSurfaces: false,
    };
  }

  // Listed on map (`joinMode: open`) — peek always; full detail after roster / sign-in flow.
  if (!viewerUserId) {
    return {
      exposure: 'redacted',
      level,
      gateReason: 'sign_in',
      canViewFullActivity: false,
      canOpenDetailPage: true,
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
