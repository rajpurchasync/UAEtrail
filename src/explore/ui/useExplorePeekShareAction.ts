import { useCallback } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useShareSheet } from '../../context/ShareSheetContext';
import type { DiscoveryCardViewModel } from '../../discovery/discoveryCardViewModel';

type Args = {
  selectedCard: DiscoveryCardViewModel | null;
  activity: ActivityDTO | null | undefined;
  user: { id: string } | null | undefined;
  onInviteActivity?: (
    activity: ActivityDTO,
    options?: { canSendBuddyInvites?: boolean }
  ) => void;
  onShareHostedActivity?: (activity: ActivityDTO) => void;
};

/** Map peek hero + wire `share_activity` — unified outing share sheet (in-app + link). */
export function useExplorePeekShareAction({
  selectedCard,
  activity,
  user,
  onInviteActivity,
  onShareHostedActivity,
}: Args) {
  const shareSheet = useShareSheet();

  return useCallback(() => {
    if (activity?.status === 'published') {
      if (onShareHostedActivity) {
        onShareHostedActivity(activity);
        return;
      }
      onInviteActivity?.(activity, { canSendBuddyInvites: Boolean(user) });
      return;
    }
    if (!selectedCard?.sharePath) return;
    shareSheet.openShare({
      title: selectedCard.shareTitle,
      text: selectedCard.shareText ?? '',
      path: selectedCard.sharePath,
    });
  }, [
    activity,
    onInviteActivity,
    onShareHostedActivity,
    selectedCard,
    shareSheet,
    user,
  ]);
}
