import type { ViewerGateReason } from './activity-viewer-access.js';

/** Person profile payload depth (member card vs trusted). */
export type ProfileDetailExposure = 'full' | 'public' | 'none';

export type ProfileVisibilitySetting = 'public' | 'group_members' | 'private';

export type ProfileViewerAccessLevel =
  | 'self'
  | 'platform_admin'
  | 'public'
  | 'group_member'
  | 'accepted_buddy'
  | 'activity_participant'
  | 'host_of_activity'
  | 'denied';

export type ProfileViewerAccessDTO = {
  exposure: ProfileDetailExposure;
  level: ProfileViewerAccessLevel;
  gateReason: ViewerGateReason | null;
  /** Trusted / self — full fields (year goal, upcoming list, etc.). */
  canViewFullProfile: boolean;
  /** Signed-in public card (or full counts as open). */
  canOpenMemberProfile: boolean;
};

const TRUSTED_LEVELS: ReadonlySet<ProfileViewerAccessLevel> = new Set([
  'platform_admin',
  'self',
  'group_member',
  'accepted_buddy',
  'activity_participant',
  'host_of_activity',
]);

/**
 * Person profile exposure from visibility setting + relationship level.
 * Guests (`viewerUserId === null`) never receive `public` or `full`.
 */
export const computeProfileDetailExposure = (input: {
  profileVisibility: ProfileVisibilitySetting;
  level: ProfileViewerAccessLevel;
  viewerUserId: string | null;
}): ProfileViewerAccessDTO => {
  const { profileVisibility, level, viewerUserId } = input;

  if (!viewerUserId) {
    return {
      exposure: 'none',
      level: level === 'denied' ? 'denied' : 'public',
      gateReason: 'sign_in',
      canViewFullProfile: false,
      canOpenMemberProfile: false,
    };
  }

  if (level === 'self' || level === 'platform_admin') {
    return {
      exposure: 'full',
      level,
      gateReason: null,
      canViewFullProfile: true,
      canOpenMemberProfile: true,
    };
  }

  if (profileVisibility === 'public') {
    return {
      exposure: 'public',
      level: level === 'denied' ? 'public' : level,
      gateReason: null,
      canViewFullProfile: false,
      canOpenMemberProfile: true,
    };
  }

  if (TRUSTED_LEVELS.has(level)) {
    return {
      exposure: 'full',
      level,
      gateReason: null,
      canViewFullProfile: true,
      canOpenMemberProfile: true,
    };
  }

  return {
    exposure: 'none',
    level: 'denied',
    gateReason: profileVisibility === 'group_members' ? null : null,
    canViewFullProfile: false,
    canOpenMemberProfile: false,
  };
};
