import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { GuestBrowseGateIntent } from '../content/guestBrowseGateCopy';
import type { GuestSheetSurface } from './activityJoinSheetTypes';

export type ActivityJoinGuestOverlay =
  | { kind: 'closed' }
  | {
      kind: 'open';
      surface: GuestSheetSurface;
      intent: 'activity' | 'place';
      browseGateIntent: GuestBrowseGateIntent;
      pendingPeekAction: ActivityMapPeekActionId | null;
    };

export const ACTIVITY_JOIN_GUEST_OVERLAY_CLOSED: ActivityJoinGuestOverlay = { kind: 'closed' };

export const activityJoinGuestOverlayIsOpen = (overlay: ActivityJoinGuestOverlay): boolean =>
  overlay.kind === 'open';

export const activityJoinGuestOverlayOpenJoin = (
  intent: 'activity' | 'place',
  pendingAction: ActivityMapPeekActionId
): ActivityJoinGuestOverlay => ({
  kind: 'open',
  surface: 'join',
  intent,
  browseGateIntent: 'peek-details',
  pendingPeekAction: pendingAction,
});

export const activityJoinGuestOverlayOpenBrowse = (
  browseGateIntent: GuestBrowseGateIntent,
  pendingAction: ActivityMapPeekActionId
): ActivityJoinGuestOverlay => ({
  kind: 'open',
  surface: 'browse',
  intent: 'activity',
  browseGateIntent,
  pendingPeekAction: pendingAction,
});