import {
  resolveParticipationMode,
  type ParticipationMode,
} from '@uaetrail/shared-types';

export const GUEST_GATE_OOPS_TITLE = 'Oops — you are not signed in';

/** Mobile explore dismissible banner (after coach marks). */
export const guestJoinBannerBody = (): string =>
  'Save outings, message hosts, and show up with a crew — free to join.';

export type GuestJoinSheetIntent = 'activity' | 'place';

export type GuestJoinCopyInput = {
  intent?: GuestJoinSheetIntent;
  participationMode?: ParticipationMode | null;
  requirements?: string[] | null;
  activityTitle?: string | null;
};

export const guestJoinSheetHeadline = (_input: GuestJoinCopyInput): string => GUEST_GATE_OOPS_TITLE;

export const guestJoinSheetBody = (input: GuestJoinCopyInput): string => {
  if (input.intent === 'place') {
    const title = input.activityTitle?.trim();
    return title
      ? `Join the community today to open ${title} — photos, tips, and reviews from people who’ve been there.`
      : 'Join the community today to see full trail and camp details from the community.';
  }
  const mode = resolveParticipationMode(input.participationMode, input.requirements);
  const title = input.activityTitle?.trim();
  if (mode === 'rsvp') {
    return title
      ? `Join the community today to say you’re going on “${title}” and keep it on your Plan.`
      : 'Join the community today to say you’re going, meet the group, and keep your plans in one place.';
  }
  return title
    ? `Join the community today to request a spot on “${title}” and message the host before you go together.`
    : 'Join the community today to request outings and chat with hosts before you head outside.';
};
