import type { WishlistItemDTO } from '@uaetrail/shared-types';
import type { QueryClient } from '@tanstack/react-query';
import { api } from '../api/index';
import { meWishlistQueryKey, memberJourneyMapQueryKeyPrefix } from './clientQueryKeys';

export type WishlistTarget = {
  locationId?: string;
  destinationId?: string;
  activityId?: string;
  alertOnMatch?: boolean;
  watchOutingCategory?: string | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
};

export const checkWishlistTarget = async (
  target: WishlistTarget
): Promise<{ saved: boolean; wishlistItemId: string | null }> => {
  const res = await api.checkWishlist(target);
  return res.data;
};

export const addWishlistTarget = async (target: WishlistTarget): Promise<WishlistItemDTO> => {
  const res = await api.addWishlistItem(target);
  return res.data;
};

export const removeWishlistItemById = async (id: string): Promise<void> => {
  await api.removeWishlistItem(id);
};

export const fetchMeWishlist = async (): Promise<WishlistItemDTO[]> => {
  const res = await api.getMeWishlist();
  return res.data ?? [];
};

export const invalidateMeWishlistQueries = (queryClient: QueryClient): void => {
  void queryClient.invalidateQueries({ queryKey: meWishlistQueryKey });
  void queryClient.invalidateQueries({ queryKey: memberJourneyMapQueryKeyPrefix });
};
