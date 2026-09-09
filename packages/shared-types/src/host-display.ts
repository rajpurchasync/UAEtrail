/** Demo / onboarding role labels — never shown as a person's name. */
export const ROLE_PLACEHOLDER_DISPLAY_NAME =
  /^(individual(\s+host)?|agency(\s+(owner|guide))?|shop(\s+owner)?|demo\s+participant|community\s+member|suspended\s+user|host|account)$/i;

export const isRolePlaceholderDisplayName = (name?: string | null): boolean => {
  const trimmed = name?.trim();
  if (!trimmed) return true;
  return ROLE_PLACEHOLDER_DISPLAY_NAME.test(trimmed);
};

export interface HostPersonNameInput {
  /** Assigned guide / on-ground host profile name */
  guideName?: string | null;
  /** User who created the activity record */
  createdByName?: string | null;
  /** Tenant owner profile name — fallback when guide is unset or a placeholder */
  tenantOwnerName?: string | null;
  /** Organization brand — used only to reject org labels masquerading as people */
  tenantName?: string | null;
}

/** Resolve the person hosting an activity. Never returns org/tenant labels or role placeholders. */
export const resolveHostPersonDisplayName = (input: HostPersonNameInput): string | null => {
  const tenant = input.tenantName?.trim() || null;

  for (const candidate of [input.guideName, input.createdByName, input.tenantOwnerName]) {
    const trimmed = candidate?.trim();
    if (!trimmed || isRolePlaceholderDisplayName(trimmed)) continue;
    if (tenant && trimmed.toLowerCase() === tenant.toLowerCase()) continue;
    return trimmed;
  }

  return null;
};

export const hostPersonFirstName = (input: HostPersonNameInput): string => {
  const person = resolveHostPersonDisplayName(input);
  if (person) return person.split(/\s+/)[0];
  return 'Host';
};

type HostIdentityFields = {
  hostName?: string | null;
  organizerName?: string | null;
};

type HostUserIdentityFields = {
  hostUserId?: string | null;
  organizerUserId?: string | null;
};

type HostAvatarIdentityFields = {
  hostAvatar?: string | null;
  organizerAvatar?: string | null;
};

/** Display name for UI — trusts API-resolved hostName; legacy organizerName only for stale client payloads. */
export const resolveActivityHostDisplayName = (activity: HostIdentityFields): string => {
  const name = activity.hostName ?? activity.organizerName;
  if (name?.trim() && !isRolePlaceholderDisplayName(name)) return name.trim();
  return 'Host';
};

export const resolveActivityHostUserId = (
  activity: HostUserIdentityFields
): string | null | undefined => activity.hostUserId ?? activity.organizerUserId ?? null;

export const resolveActivityHostAvatar = (
  activity: HostAvatarIdentityFields
): string | null | undefined => activity.hostAvatar ?? activity.organizerAvatar ?? null;

/** Organization brand — shown when different from the individual host (e.g. companies). */
export const showTenantBrand = (
  activity: HostIdentityFields & { tenantName?: string | null }
): boolean => {
  const host = resolveActivityHostDisplayName(activity);
  const org = activity.tenantName?.trim();
  return Boolean(org && org !== host);
};
