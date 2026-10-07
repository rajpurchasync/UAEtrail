import { useCallback, useEffect, useState } from 'react';
import type { EntityFollowCheckDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import { AppButton } from '../mobile/AppButton';

type EntityFollowControlsProps = {
  tenantId?: string;
  locationId?: string;
  merchantId?: string;
  disabled?: boolean;
  className?: string;
  onStatusMessage?: (message: string | null) => void;
};

export const EntityFollowControls = ({
  tenantId,
  locationId,
  merchantId,
  disabled = false,
  className,
  onStatusMessage,
}: EntityFollowControlsProps) => {
  const target = locationId
    ? { locationId }
    : tenantId
      ? { tenantId }
      : merchantId
        ? { merchantId }
        : null;

  const [state, setState] = useState<EntityFollowCheckDTO | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (disabled || !target) {
      setState(null);
      return;
    }
    void api
      .checkEntityFollow(target)
      .then((res) => setState(res.data))
      .catch(() => setState(null));
  }, [disabled, target]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    if (!target || !state || busy) return;
    setBusy(true);
    onStatusMessage?.(null);
    try {
      if (state.following && state.followId) {
        await api.unfollowEntity(state.followId);
        setState({ following: false, followId: null });
        onStatusMessage?.('Unfollowed.');
      } else {
        const res = await api.followEntity(target);
        setState({ following: true, followId: res.data.id });
        onStatusMessage?.('Following — outing alerts on for this place or host.');
      }
    } catch (err) {
      onStatusMessage?.(err instanceof Error ? err.message : 'Could not update follow.');
    } finally {
      setBusy(false);
    }
  };

  if (disabled || !target || !state) return null;

  return (
    <div className={className}>
      <AppButton
        type="button"
        variant={state.following ? 'secondary' : 'primary'}
        fullWidth
        disabled={busy}
        onClick={() => void toggle()}
      >
        {state.following ? 'Following · outing alerts on' : 'Follow · outing alerts'}
      </AppButton>
      <p className="mt-2 text-center text-xs text-neutral-500">
        Get notified when a hosted outing is published at this place or by this team.
      </p>
    </div>
  );
};
