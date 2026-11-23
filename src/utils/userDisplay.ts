import {
  formatExplorePersonDisplayName,
  hostPersonFirstName,
  isRolePlaceholderDisplayName,
  resolveHostPersonDisplayName,
} from '@uaetrail/shared-types';
import { HOST_FALLBACK_DISPLAY_NAME } from '../content/workspaceVocabulary';

export { isRolePlaceholderDisplayName, resolveHostPersonDisplayName };

export const getFirstName = (name?: string | null, email?: string | null): string => {
  if (name?.trim()) return name.trim().split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return 'Account';
};

/** Two uppercase initials from a display name, e.g. "John Doe" → "JD". */
export const initialsFromName = (name?: string | null): string => {
  const parts = (typeof name === 'string' ? name : '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const PLACEHOLDER_FIRST_NAMES = new Set(['pending', 'user', 'guest', 'account', 'new']);

/** Explore list/detail host label — full display name from activity host fields. */
export const resolveExploreHostLabel = (options: {
  hostName?: string | null;
  participantName?: string | null;
  tenantName?: string | null;
}): string => {
  const host = options.hostName?.trim();
  if (host && !isRolePlaceholderDisplayName(host)) {
    return formatExplorePersonDisplayName(host);
  }

  const requester = options.participantName?.trim();
  if (requester && !isRolePlaceholderDisplayName(requester)) {
    return formatExplorePersonDisplayName(requester);
  }

  return HOST_FALLBACK_DISPLAY_NAME;
};

/** Prefer a readable requester label — avoids showing placeholder first names like "Pending". */
export const formatRequesterDisplayName = (name?: string | null, email?: string | null): string => {
  const trimmed = name?.trim();
  if (!trimmed) {
    if (email) return email.split('@')[0];
    return 'Community member';
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return trimmed;
  if (PLACEHOLDER_FIRST_NAMES.has(parts[0].toLowerCase())) return 'Community member';
  return trimmed;
};

export { hostPersonFirstName };