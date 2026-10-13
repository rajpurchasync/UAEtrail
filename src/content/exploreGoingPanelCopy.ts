/**
 * Join-me invites, member-discovery quota gates, and legacy aliases.
 * Explore People browse panel copy: `explorePeopleBrowseCopy.ts`.
 */

export {
  EXPLORE_PEOPLE_BROWSE_MAP_BUTTON_LABEL as EXPLORE_GOING_MAP_BUTTON_LABEL,
  explorePeopleBrowseMapButtonAriaLabel as exploreGoingMapButtonAriaLabel,
} from './explorePeopleBrowseCopy';

export const MEMBER_DISCOVERY_QUOTA_GATE_TITLE = 'Discovery limit reached';
export const MEMBER_DISCOVERY_QUOTA_GATE_BODY =
  'Free members can open five new profiles from Discover each month. Pro members get unlimited discovery.';
export const MEMBER_DISCOVERY_QUOTA_GATE_CTA = 'See Pro options';

export const ACTIVITY_JOIN_INVITE_BANNER =
  'A friend invited you to join this outing — RSVP or request to join. Organizer approval still applies when the outing requires it.';

export const activityJoinInviteBanner = (inviterDisplayName?: string | null): string =>
  inviterDisplayName?.trim()
    ? `${inviterDisplayName.trim()} invited you to join this outing — RSVP or request to join. Organizer approval still applies when the outing requires it.`
    : ACTIVITY_JOIN_INVITE_BANNER;

export const JOIN_ME_INVITE_FINE_PRINT =
  'Your friend still joins or requests a spot on their own; organizer approval applies where the outing requires it.';

export const EXPLORE_BUDDY_JOIN_ME_INVITE = 'Join me';
export const EXPLORE_BUDDY_JOIN_ME_INVITE_SENT_LABEL = 'Invited';
export const exploreBuddyJoinMeInviteSent = (name: string): string =>
  `Join invite sent to ${name}.`;

export const JOIN_ME_INVITE_RATE_LIMIT =
  'You have sent the maximum Join me invites for this outing today. Try again tomorrow or share the link instead.';
