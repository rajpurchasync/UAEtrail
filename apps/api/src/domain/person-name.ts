import {
  isAccountRoleDisplaySuffix,
  resolveMemberDisplayName,
  stripAccountRoleDisplaySuffix,
} from '@uaetrail/shared-types';
import { z } from 'zod';

export { resolveMemberDisplayName, stripAccountRoleDisplaySuffix };

export const wireMemberDisplayName = (input: {
  displayName?: string | null;
  givenName?: string | null;
  surname?: string | null;
  email?: string | null;
}): string => resolveMemberDisplayName({ ...input, fallback: 'Member' });

export const profileDisplayNameFromAuthUser = (user: {
  email: string;
  profile?: {
    displayName?: string | null;
    givenName?: string | null;
    surname?: string | null;
  } | null;
}): string =>
  wireMemberDisplayName({
    displayName: user.profile?.displayName,
    givenName: user.profile?.givenName,
    surname: user.profile?.surname,
    email: user.email,
  });

export const PERSON_NAME_MIN = 3;
export const PERSON_NAME_MAX = 20;

/** Latin letters only (no spaces, numbers, or symbols). */
const PERSON_NAME_PATTERN = /^[A-Za-z]+$/;

export const personNameSchema = z
  .string()
  .trim()
  .min(PERSON_NAME_MIN, `Use at least ${PERSON_NAME_MIN} letters.`)
  .max(PERSON_NAME_MAX, `Use at most ${PERSON_NAME_MAX} letters.`)
  .regex(PERSON_NAME_PATTERN, 'Use letters only (A–Z).');

export const personNameFieldsSchema = z.object({
  givenName: personNameSchema,
  surname: personNameSchema,
});

export const formatDisplayNameFromParts = (givenName: string, surname: string): string =>
  `${givenName.trim()} ${surname.trim()}`;

export const splitUndelimitedDisplayName = (
  displayName: string | null | undefined
): { givenName: string; surname: string } => {
  const trimmed = displayName?.trim() ?? '';
  if (!trimmed) return { givenName: '', surname: '' };
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace <= 0) return { givenName: trimmed, surname: '' };
  return {
    givenName: trimmed.slice(0, lastSpace).trim(),
    surname: trimmed.slice(lastSpace + 1).trim(),
  };
};

export const resolveProfilePersonNames = (profile: {
  givenName?: string | null;
  surname?: string | null;
  displayName?: string | null;
}): { givenName: string; surname: string } => {
  const given = profile.givenName?.trim() ?? '';
  const sur = profile.surname?.trim() ?? '';
  if (given && sur) {
    if (isAccountRoleDisplaySuffix(sur)) return { givenName: given, surname: '' };
    return { givenName: given, surname: sur };
  }
  if (given) return { givenName: given, surname: '' };
  return splitUndelimitedDisplayName(
    profile.displayName ? stripAccountRoleDisplaySuffix(profile.displayName) : profile.displayName
  );
};
