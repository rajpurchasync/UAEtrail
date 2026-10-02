import { joinAuthPath } from '../../config/routingCatalog';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExploreCardModel } from '../exploreCardModel';
import { resolveExploreFavoriteTarget } from '../exploreCardModel';
import { api } from '../../api/index';
import { useAuth } from '../../context/AuthContext';

export type ExploreSaveState = {
  canSave: boolean;
  saved: boolean;
  favoriteId: string | null;
  busy: boolean;
  notice: string | null;
  toggle: () => Promise<void>;
};

export const useExploreSaveFavorite = (card: ExploreCardModel): ExploreSaveState => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const target = resolveExploreFavoriteTarget(card);
  const [saved, setSaved] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !target) {
      setSaved(false);
      setFavoriteId(null);
      return;
    }
    let cancelled = false;
    void api
      .checkFavorite(target)
      .then((res) => {
        if (cancelled) return;
        setSaved(res.data.saved);
        setFavoriteId(res.data.favoriteId);
      })
      .catch(() => {
        if (!cancelled) {
          setSaved(false);
          setFavoriteId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, card.id, target?.activityId, target?.locationId, target?.participantIntentId, target?.merchantId, target?.tenantId]);

  const toggle = useCallback(async () => {
    if (!target) return;
    if (!user) {
      navigate(joinAuthPath(card.sharePath));
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      if (saved && favoriteId) {
        await api.removeFavorite(favoriteId);
        setSaved(false);
        setFavoriteId(null);
        setNotice('Removed from your saved map.');
      } else {
        const res = await api.addFavorite(target);
        setSaved(true);
        setFavoriteId(res.data.id);
        setNotice('Saved to your wishlist — we can alert you when similar plans show up.');
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not update saved map.');
    } finally {
      setBusy(false);
    }
  }, [card.sharePath, favoriteId, navigate, saved, target, user]);

  return {
    canSave: Boolean(target),
    saved,
    favoriteId,
    busy,
    notice,
    toggle,
  };
};
