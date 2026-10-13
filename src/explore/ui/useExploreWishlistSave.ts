import { joinAuthPath } from '../../config/routingCatalog';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExploreCardModel } from '../exploreCardModel';
import { resolveExploreWishlistTarget } from '../exploreCardModel';
import { api } from '../../api/index';
import { useAuth } from '../../context/AuthContext';

export type ExploreWishlistSaveState = {
  canSave: boolean;
  saved: boolean;
  wishlistItemId: string | null;
  busy: boolean;
  notice: string | null;
  toggle: () => Promise<void>;
};

export const useExploreWishlistSave = (card: ExploreCardModel): ExploreWishlistSaveState => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const target = resolveExploreWishlistTarget(card);
  const [saved, setSaved] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !target) {
      setSaved(false);
      setWishlistItemId(null);
      return;
    }
    let cancelled = false;
    void api
      .checkWishlist(target)
      .then((res) => {
        if (cancelled) return;
        setSaved(res.data.saved);
        setWishlistItemId(res.data.wishlistItemId);
      })
      .catch(() => {
        if (!cancelled) {
          setSaved(false);
          setWishlistItemId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, card.id, target?.activityId, target?.locationId]);

  const toggle = useCallback(async () => {
    if (!target) return;
    if (!user) {
      navigate(joinAuthPath(card.sharePath));
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      if (saved && wishlistItemId) {
        await api.removeWishlistItem(wishlistItemId);
        setSaved(false);
        setWishlistItemId(null);
        setNotice('Removed from your wishlist.');
      } else {
        const res = await api.addWishlistItem(target);
        setSaved(true);
        setWishlistItemId(res.data.id);
        setNotice('Saved to your wishlist — we can alert you when similar plans show up.');
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not update wishlist.');
    } finally {
      setBusy(false);
    }
  }, [card.sharePath, navigate, saved, target, user, wishlistItemId]);

  return {
    canSave: Boolean(target),
    saved,
    wishlistItemId,
    busy,
    notice,
    toggle,
  };
};
