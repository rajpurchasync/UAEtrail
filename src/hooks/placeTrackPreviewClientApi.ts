import type { PlaceTrackPreviewDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

/** R8.1: place consumer detail must not import `api` from `src/activity` / templates. */
export const fetchPublicPlaceTrackPreview = async (
  placeId: string
): Promise<PlaceTrackPreviewDTO | null> => {
  const res = await api.getPublicPlaceTrackPreview(placeId);
  return res.data ?? null;
};
