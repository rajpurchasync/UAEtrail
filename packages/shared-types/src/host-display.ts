/** When no person or brand name is available on consumer surfaces (UPL Host). */
export const HOST_FALLBACK_DISPLAY_NAME = 'Host';
/** @deprecated Old payloads / placeholders — treat as {@link HOST_FALLBACK_DISPLAY_NAME}. */
export const ORGANIZER_FALLBACK_DISPLAY_NAME = 'Organizer';

/** Demo / onboarding role labels — never shown as a person's name. */
export const ROLE_PLACEHOLDER_DISPLAY_NAME =
  /^(individual(\s+host)?|agency(\s+(owner|guide))?|shop(\s+owner)?|demo\s+participant|community\s+member|suspended\s+user|host|account)$/i;

export const isRolePlaceholderDisplayName = (name?: string | null): boolean => {
  const trimmed = name?.trim();
  if (!trimmed) return true;
  if (trimmed.toLowerCase() === HOST_FALLBACK_DISPLAY_NAME.toLowerCase()) return true;
  if (trimmed.toLowerCase() === ORGANIZER_FALLBACK_DISPLAY_NAME.toLowerCase()) return true;
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
  const createdBy = input.createdByName?.trim() || null;

  for (const candidate of [input.guideName, input.createdByName, input.tenantOwnerName]) {
    const trimmed = candidate?.trim();
    if (!trimmed || isRolePlaceholderDisplayName(trimmed)) continue;
    if (tenant && trimmed.toLowerCase() === tenant.toLowerCase()) {
      // Buddy / Find tenants are often named after the member — still show their name on peek cards.
      if (createdBy && trimmed.toLowerCase() === createdBy.toLowerCase()) return trimmed;
      continue;
    }
    return trimmed;
  }

  return null;
};

export const hostPersonFirstName = (input: HostPersonNameInput): string => {
  const person = resolveHostPersonDisplayName(input);
  if (person) return person.split(/\s+/)[0];
  return HOST_FALLBACK_DISPLAY_NAME;
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
  return HOST_FALLBACK_DISPLAY_NAME;
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
