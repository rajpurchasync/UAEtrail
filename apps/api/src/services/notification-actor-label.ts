import { findAuthUserById } from '../lib/auth-users-store.js';
import { normalizeProfileVisibility } from '../lib/media-access.js';
import { canViewProfileField, resolveProfileViewerAccess } from './profile-viewer-access.js';

const FALLBACK_LABEL = 'Someone on UAE Trail';

/** Respect `profileVisibility` when naming an actor in in-app / push copy (Phase 7.6). */
export const resolveNotificationActorDisplayName = async (
  actorUserId: string,
  recipientUserId: string
): Promise<string> => {
  const actor = await findAuthUserById(actorUserId);
  if (!actor) return FALLBACK_LABEL;

  const visibility = normalizeProfileVisibility(actor.profile?.profileVisibility);
  const access = await resolveProfileViewerAccess({
    viewerUserId: recipientUserId,
    targetUserId: actorUserId,
    targetVisibility: visibility,
  });

  if (!canViewProfileField(visibility, access, 'identity')) {
    return FALLBACK_LABEL;
  }

  const displayName = actor.profile?.displayName?.trim();
  if (displayName) return displayName;

  const emailLocal = actor.email?.split('@')[0]?.trim();
  return emailLocal || FALLBACK_LABEL;
};

/** Fan-out notify paths: one actor load; public profiles reuse the same label for every recipient. */
export const resolveNotificationActorDisplayNamesForRecipients = async (
  actorUserId: string,
  recipientUserIds: string[]
): Promise<Map<string, string>> => {
  const uniqueRecipients = [...new Set(recipientUserIds.filter(Boolean))];
  const labels = new Map<string, string>();
  if (uniqueRecipients.length === 0) return labels;

  const actor = await findAuthUserById(actorUserId);
  if (!actor) {
    for (const recipientUserId of uniqueRecipients) {
      labels.set(recipientUserId, FALLBACK_LABEL);
    }
    return labels;
  }

  const visibility = normalizeProfileVisibility(actor.profile?.profileVisibility);
  const publicLabel =
    actor.profile?.displayName?.trim() ||
    actor.email?.split('@')[0]?.trim() ||
    FALLBACK_LABEL;

  if (visibility === 'public') {
    for (const recipientUserId of uniqueRecipients) {
      labels.set(recipientUserId, publicLabel);
    }
    return labels;
  }

  await Promise.all(
    uniqueRecipients.map(async (recipientUserId) => {
      const label = await resolveNotificationActorDisplayName(actorUserId, recipientUserId);
      labels.set(recipientUserId, label);
    })
  );
  return labels;
};
