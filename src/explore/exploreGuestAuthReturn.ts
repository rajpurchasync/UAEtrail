import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { GuestSheetSurface } from '../hooks/useActivityJoinFlow';
import { resolveActivityPeekGuestAuthReturnPath } from './activityPeekGuestAuthReturn';

/** Post-auth destination for explore guest join / browse gates (map peek). */
export const resolveExploreGuestAuthReturnPath = (input: {
  guestSheetSurface: GuestSheetSurface;
  guestSheetIntent: 'activity' | 'place';
  pendingPeekAction: ActivityMapPeekActionId | null;
  activity?: {
    id: string;
    hostUserId?: string | null;
    groupChatId?: string | null;
  } | null;
  browseReturnPath: string;
}): string | undefined => resolveActivityPeekGuestAuthReturnPath(input);
