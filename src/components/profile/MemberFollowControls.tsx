import { useCallback, useEffect, useState } from 'react';
import type { MemberFollowStateDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';
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
  const [state, setState] = useState<MemberFollowStateDTO | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (disabled || !targetUserId) {
      setState(null);
      return;
    }
    void api
      .getMemberFollowState(targetUserId)
      .then((res) => setState(res.data))
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
      const res = state.isFollowing
        ? await api.unfollowMember(targetUserId)
        : await api.followMember(targetUserId);
      setState(res.data);
      onStatusMessage?.(
        res.data.isFollowing
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
        {state.isFollowing ? 'Following · host alerts on' : 'Follow · host outing alerts'}
      </AppButton>
      <p className="mt-2 text-center text-xs text-neutral-500">
        Get notified when they host an outing on the map — not their find-a-group posts.
      </p>
    </div>
  );
};
