import { findAuthUserById } from '../lib/auth-users.js';
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
