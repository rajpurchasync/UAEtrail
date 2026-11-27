import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { EntityFollowCheckDTO } from '@uaetrail/shared-types';
import {
  fetchEntityFollowState,
  followEntityTarget,
  invalidateEntityFollowsQueries,
  unfollowEntityById,
  type EntityFollowTarget,
} from '../../hooks/entityFollowApi';
import { AppButton } from '../mobile/AppButton';

type EntityFollowControlsProps = {
  tenantId?: string;
  locationId?: string;
  shopId?: string;
  disabled?: boolean;
  className?: string;
  onStatusMessage?: (message: string | null) => void;
};

export const EntityFollowControls = ({
  tenantId,
  locationId,
  shopId,
  disabled = false,
  className,
  onStatusMessage,
}: EntityFollowControlsProps) => {
  const queryClient = useQueryClient();
  const target = useMemo((): EntityFollowTarget | null => {
    if (locationId) return { locationId };
    if (tenantId) return { tenantId };
    if (shopId) return { shopId };
    return null;
  }, [locationId, tenantId, shopId]);

  const [state, setState] = useState<EntityFollowCheckDTO | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (disabled || !target) {
      setState(null);
      return;
    }
    void fetchEntityFollowState(target)
      .then(setState)
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
        await unfollowEntityById(state.followId);
        setState({ following: false, followId: null });
        onStatusMessage?.('Unfollowed.');
      } else {
        const followId = await followEntityTarget(target);
        setState({ following: true, followId });
        onStatusMessage?.('Following — outing alerts on for this place or host.');
      }
      invalidateEntityFollowsQueries(queryClient);
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
