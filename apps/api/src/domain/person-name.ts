import { z } from 'zod';

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

export const splitLegacyDisplayName = (
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
  if (given && sur) return { givenName: given, surname: sur };
  return splitLegacyDisplayName(profile.displayName);
};
