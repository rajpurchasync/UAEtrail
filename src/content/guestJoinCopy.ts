import {
  resolveParticipationMode,
  type ParticipationMode,
} from '@uaetrail/shared-types';

export type GuestJoinSheetIntent = 'activity' | 'place';

export type GuestJoinCopyInput = {
  intent?: GuestJoinSheetIntent;
  participationMode?: ParticipationMode | null;
  requirements?: string[] | null;
  activityTitle?: string | null;
};

export const guestJoinSheetHeadline = (input: GuestJoinCopyInput): string => {
  if (input.intent === 'place') return 'View details — join free';
  const mode = resolveParticipationMode(input.participationMode, input.requirements);
  return mode === 'rsvp' ? "Say you're going — join free" : 'Request to join — sign up free';
};

export const guestJoinSheetBody = (input: GuestJoinCopyInput): string => {
  if (input.intent === 'place') {
    const title = input.activityTitle?.trim();
    return title
      ? `Create a free account to open "${title}" — trail info, photos, and reviews from the community.`
      : 'Create a free account to view trail and camp locations on UAE Trail.';
  }
  const mode = resolveParticipationMode(input.participationMode, input.requirements);
  const title = input.activityTitle?.trim();
  if (mode === 'rsvp') {
    return title
      ? `Create a free account to tap I'm going on "${title}" and see it on your Up next plans.`
      : 'Create a free account to say you\'re going on outings and see them on your Up next plans.';
  }
  return title
    ? `Sign up free to request "${title}" and message the host before you go together.`
    : 'Create a free account to request activities and message hosts on UAE Trail.';
};

export const guestJoinBannerBody = (): string =>
  'Browse free. Sign up to say you\'re going or request a spot on outings.';
