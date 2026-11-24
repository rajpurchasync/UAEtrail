import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { MemberFollowStateDTO } from '@uaetrail/shared-types';
import { fetchMemberFollowState, setMemberFollow } from '../../hooks/memberFollowApi';
import { meFollowingMembersQueryKey } from '../../hooks/clientQueryKeys';
import { useAuth } from '../../context/AuthContext';
import { AppButton } from '../mobile/AppButton';

type MemberFollowControlsProps = {
  targetUserId: string;
  /** Hide when viewer is the target */
  disabled?: boolean;
  className?: string;
  onStatusMessage?: (message: string | null) => void;
};

export const MemberFollowControls = ({
  targetUserId,
  disabled = false,
  className,
  onStatusMessage,
}: MemberFollowControlsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<MemberFollowStateDTO | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (disabled || !targetUserId) {
      setState(null);
      return;
    }
    void fetchMemberFollowState(targetUserId)
      .then(setState)
      .catch(() => setState(null));
  }, [disabled, targetUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    if (!state || busy) return;
    setBusy(true);
    onStatusMessage?.(null);
    try {
      const next = await setMemberFollow(targetUserId, !state.isFollowing);
      setState(next);
      if (user?.id) {
        void queryClient.invalidateQueries({ queryKey: meFollowingMembersQueryKey(user.id) });
      }
      onStatusMessage?.(
        next.isFollowing
          ? 'You will get notified when they host an outing.'
          : 'Unfollowed.'
      );
    } catch (err) {
      onStatusMessage?.(err instanceof Error ? err.message : 'Could not update follow.');
    } finally {
      setBusy(false);
    }
  };

  if (disabled || !state || (!state.isFollowing && !state.canFollow)) return null;

  return (
    <div className={className}>
      <AppButton
        type="button"
        variant={state.isFollowing ? 'secondary' : 'primary'}
        fullWidth
        disabled={busy}
        onClick={() => void toggle()}
      >
        {busy
          ? '…'
          : state.isFollowing
            ? 'Unfollow'
            : 'Follow · host outing alerts'}
      </AppButton>
      <p className="mt-2 text-center text-xs text-neutral-500">
        {state.isFollowing
          ? 'Stop host outing alerts for this member.'
          : 'Get notified when they host an outing on the map — not their find-a-group posts.'}
      </p>
    </div>
  );
};
