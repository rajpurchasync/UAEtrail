export const PERSON_NAME_MIN = 3;
export const PERSON_NAME_MAX = 20;

const LETTERS_ONLY = /^[A-Za-z]+$/;

export const validatePersonName = (value: string, label: 'Name' | 'Surname'): string | null => {
  const trimmed = value.trim();
  if (trimmed.length < PERSON_NAME_MIN) {
    return `${label} must be at least ${PERSON_NAME_MIN} letters.`;
  }
  if (trimmed.length > PERSON_NAME_MAX) {
    return `${label} must be at most ${PERSON_NAME_MAX} letters.`;
  }
  if (!LETTERS_ONLY.test(trimmed)) {
    return `${label} must contain letters only (A–Z).`;
  }
  return null;
};

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

/** Strip non-letters while typing (optional UX helper). */
export const sanitizePersonNameInput = (value: string): string =>
  value.replace(/[^A-Za-z]/g, '').slice(0, PERSON_NAME_MAX);
