import { joinAuthPath } from '../../config/routingCatalog';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import { useNavigate } from 'react-router-dom';
import type { ExploreCardModel } from '../exploreCardModel';
import { resolveExploreWishlistTarget } from '../exploreCardModel';
import {
  addWishlistTarget,
  checkWishlistTarget,
  invalidateMeWishlistQueries,
  removeWishlistItemById,
} from '../../hooks/wishlistClientApi';
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
  const queryClient = useQueryClient();
  const target = useMemo(() => resolveExploreWishlistTarget(card), [card]);
  const [saved, setSaved] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useSafeAsyncEffect(
    async (isActive) => {
      if (!user || !target) {
        if (isActive()) {
          setSaved(false);
          setWishlistItemId(null);
        }
        return;
      }
      try {
        const state = await checkWishlistTarget(target);
        if (isActive()) {
          setSaved(state.saved);
          setWishlistItemId(state.wishlistItemId);
        }
      } catch {
        if (isActive()) {
          setSaved(false);
          setWishlistItemId(null);
        }
      }
    },
    [user, card.id, target?.activityId, target?.locationId]
  );

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
        await removeWishlistItemById(wishlistItemId);
        setSaved(false);
        setWishlistItemId(null);
        setNotice('Removed from your wishlist.');
      } else {
        const item = await addWishlistTarget(target);
        setSaved(true);
        setWishlistItemId(item.id);
        setNotice('Saved to your wishlist — we can alert you when similar plans show up.');
      }
      invalidateMeWishlistQueries(queryClient);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not update wishlist.');
    } finally {
      setBusy(false);
    }
  }, [card.sharePath, navigate, queryClient, saved, target, user, wishlistItemId]);

  return {
    canSave: Boolean(target),
    saved,
    wishlistItemId,
    busy,
    notice,
    toggle,
  };
};
