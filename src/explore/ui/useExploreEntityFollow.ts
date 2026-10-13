import { joinAuthPath } from '../../config/routingCatalog';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ExploreCardModel } from '../exploreCardModel';
import { resolveExploreEntityFollowTarget } from '../exploreCardModel';
import {
  fetchEntityFollowState,
  followEntityTarget,
  invalidateEntityFollowsQueries,
  unfollowEntityById,
} from '../../hooks/entityFollowApi';
import { useAuth } from '../../context/AuthContext';

export type ExploreFollowState = {
  canFollow: boolean;
  following: boolean;
  followId: string | null;
  busy: boolean;
  notice: string | null;
  toggle: () => Promise<void>;
};

export const useExploreEntityFollow = (card: ExploreCardModel): ExploreFollowState => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const target = useMemo(() => resolveExploreEntityFollowTarget(card), [card]);
  const [following, setFollowing] = useState(false);
  const [followId, setFollowId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !target) {
      setFollowing(false);
      setFollowId(null);
      return;
    }
    let cancelled = false;
    void fetchEntityFollowState(target)
      .then((state) => {
        if (cancelled) return;
        setFollowing(state.following);
        setFollowId(state.followId);
      })
      .catch(() => {
        if (!cancelled) {
          setFollowing(false);
          setFollowId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, target]);

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
        setFollowing(false);
        setFollowId(null);
        setNotice('Unfollowed.');
      } else {
        const id = await followEntityTarget(target);
        setFollowing(true);
        setFollowId(id);
        setNotice('Following — we will notify you when outings are hosted here.');
      }
      invalidateEntityFollowsQueries(queryClient);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not update follow.');
    } finally {
      setBusy(false);
    }
  }, [card.sharePath, followId, following, navigate, queryClient, target, user]);

  return {
    canFollow: Boolean(target),
    following,
    followId,
    busy,
    notice,
    toggle,
  };
};
