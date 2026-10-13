import { joinAuthPath } from '../../config/routingCatalog';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExploreCardModel } from '../exploreCardModel';
import { resolveExploreEntityFollowTarget } from '../exploreCardModel';
import { api } from '../../api/index';
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
  const navigate = useNavigate();
  const target = resolveExploreEntityFollowTarget(card);
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
    void api
      .checkEntityFollow(target)
      .then((res) => {
        if (cancelled) return;
        setFollowing(res.data.following);
        setFollowId(res.data.followId);
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
  }, [user, card.id, target?.locationId, target?.tenantId, target?.merchantId]);

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
        await api.unfollowEntity(followId);
        setFollowing(false);
        setFollowId(null);
        setNotice('Unfollowed.');
      } else {
        const res = await api.followEntity(target);
        setFollowing(true);
        setFollowId(res.data.id);
        setNotice('Following — we will notify you when outings are hosted here.');
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not update follow.');
    } finally {
      setBusy(false);
    }
  }, [card.sharePath, followId, following, navigate, target, user]);

  return {
    canFollow: Boolean(target),
    following,
    followId,
    busy,
    notice,
    toggle,
  };
};
