/** Quick-login / demo role tokens appended to seeded names — not part of the person's name. */
export const ACCOUNT_ROLE_DISPLAY_SUFFIXES = [
  'Visitor',
  'Admin',
  'Merchant',
  'Host',
  'Ops',
  'Guide',
  'Participant',
] as const;

export type AccountRoleDisplaySuffix = (typeof ACCOUNT_ROLE_DISPLAY_SUFFIXES)[number];

export const isAccountRoleDisplaySuffix = (token: string): boolean =>
  (ACCOUNT_ROLE_DISPLAY_SUFFIXES as readonly string[]).includes(token);

export const stripAccountRoleDisplaySuffix = (displayName: string): string => {
  const trimmed = displayName.trim();
  if (!trimmed) return trimmed;
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace <= 0) return trimmed;
  const suffix = trimmed.slice(lastSpace + 1);
  if (!isAccountRoleDisplaySuffix(suffix)) return trimmed;
  return trimmed.slice(0, lastSpace).trim();
};

const formatDisplayNameFromParts = (givenName: string, surname: string): string =>
  `${givenName.trim()} ${surname.trim()}`;

export const resolveMemberDisplayName = (input: {
  displayName?: string | null;
  givenName?: string | null;
  surname?: string | null;
  email?: string | null;
  /** Consumer surfaces default when nothing else is available. */
  fallback?: string;
}): string => {
  const fallback = input.fallback?.trim() || 'Explorer';
  const given = input.givenName?.trim() ?? '';
  const sur = input.surname?.trim() ?? '';
  if (given && sur) {
    if (isAccountRoleDisplaySuffix(sur)) {
      return stripAccountRoleDisplaySuffix(formatDisplayNameFromParts(given, sur));
    }
    return formatDisplayNameFromParts(given, sur);
  }
  if (given) return given;

  const stripped = stripAccountRoleDisplaySuffix(input.displayName?.trim() ?? '');
  if (stripped) return stripped;
  const fromEmail = input.email?.split('@')[0]?.trim();
  return fromEmail || fallback;
};
