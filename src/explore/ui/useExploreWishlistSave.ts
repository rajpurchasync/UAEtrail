import { joinAuthPath } from '../../config/routingCatalog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { resolveExploreWishlistTarget } from '../../discovery/discoveryCardModel';
import {
  addWishlistTarget,
  checkWishlistTarget,
  invalidateMeWishlistQueries,
  removeWishlistItemById,
} from '../../hooks/wishlistClientApi';
import { wishlistTargetStateQueryKey } from '../../hooks/clientQueryKeys';
import { useAuth } from '../../context/AuthContext';

export type ExploreWishlistSaveState = {
  canSave: boolean;
  saved: boolean;
  wishlistItemId: string | null;
  busy: boolean;
  notice: string | null;
  toggle: () => Promise<void>;
};

export const useExploreWishlistSave = (card: DiscoveryCardModel): ExploreWishlistSaveState => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const target = useMemo(() => resolveExploreWishlistTarget(card), [card]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const wishlistQueryKey = useMemo(
    () =>
      user && target
        ? wishlistTargetStateQueryKey(user.id, target)
        : ['wishlist-target-state', 'anonymous'],
    [user, target]
  );

  const { data: wishlistState } = useQuery({
    queryKey: wishlistQueryKey,
    queryFn: () => checkWishlistTarget(target!),
    enabled: Boolean(user && target),
    staleTime: 30_000,
  });

  const saved = wishlistState?.saved ?? false;
  const wishlistItemId = wishlistState?.wishlistItemId ?? null;

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
        queryClient.setQueryData(wishlistQueryKey, { saved: false, wishlistItemId: null });
        setNotice('Removed from your wishlist.');
      } else {
        const item = await addWishlistTarget(target);
        queryClient.setQueryData(wishlistQueryKey, { saved: true, wishlistItemId: item.id });
        setNotice('Saved to your wishlist — we can alert you when similar plans show up.');
      }
      invalidateMeWishlistQueries(queryClient);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not update wishlist.');
    } finally {
      setBusy(false);
    }
  }, [card.sharePath, navigate, queryClient, saved, target, user, wishlistItemId, wishlistQueryKey]);

  return {
    canSave: Boolean(target),
    saved,
    wishlistItemId,
    busy,
    notice,
    toggle,
  };
};
