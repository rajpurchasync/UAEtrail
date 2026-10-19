import { joinAuthPath } from '../../config/routingCatalog';
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { resolveExploreEntityFollowTarget } from '../../discovery/discoveryCardModel';
import {
  fetchEntityFollowState,
  followEntityTarget,
  invalidateEntityFollowsQueries,
  unfollowEntityById,
} from '../../hooks/entityFollowApi';
import { entityFollowStateQueryKey } from '../../hooks/clientQueryKeys';
import { useAuth } from '../../context/AuthContext';

export type ExploreFollowState = {
  canFollow: boolean;
  following: boolean;
  followId: string | null;
  busy: boolean;
  notice: string | null;
  toggle: () => Promise<void>;
};

export const useExploreEntityFollow = (card: DiscoveryCardModel): ExploreFollowState => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const target = useMemo(() => resolveExploreEntityFollowTarget(card), [card]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const followQueryKey =
    user && target ? entityFollowStateQueryKey(user.id, target) : ['entity-follow-state', 'anonymous'];

  const { data: followState } = useQuery({
    queryKey: followQueryKey,
    queryFn: () => fetchEntityFollowState(target!),
    enabled: Boolean(user && target),
    staleTime: 30_000,
  });

  const following = followState?.following ?? false;
  const followId = followState?.followId ?? null;

  const toggle = useCallback(async () => {
    if (!target) return;
    if (!user) {
      navigate(joinAuthPath(card.sharePath));
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      if (following && followId) {
        await unfollowEntityById(followId);
        queryClient.setQueryData(followQueryKey, { following: false, followId: null });
        setNotice('Unfollowed.');
      } else {
        const id = await followEntityTarget(target);
        queryClient.setQueryData(followQueryKey, { following: true, followId: id });
        setNotice('Following — we will notify you when outings are hosted here.');
      }
      invalidateEntityFollowsQueries(queryClient);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not update follow.');
    } finally {
      setBusy(false);
    }
  }, [card.sharePath, followId, followQueryKey, following, navigate, queryClient, target, user]);

  return {
    canFollow: Boolean(target),
    following,
    followId,
    busy,
    notice,
    toggle,
  };
};
