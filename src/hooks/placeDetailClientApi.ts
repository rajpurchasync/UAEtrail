import type {
  ActivityDTO,
  LocationDTO,
  LocationDetailResponse,
  PlaceReachableRidesResponse,
  ReviewDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';
import { getStoredSession } from '../api/client';

export const trackPlaceDetailView = async (placeId: string): Promise<void> => {
  await api.trackPlaceView(placeId);
};

export const fetchPlaceActivities = async (placeId: string): Promise<ActivityDTO[]> => {
  const res = await api.getPlaceActivities(placeId);
  return res.data ?? [];
};

/** Published rideshare offers whose destination is this place (paginated). */
export const fetchPlaceReachableRides = async (
  placeId: string,
  page = 1,
  pageSize = 10
): Promise<PlaceReachableRidesResponse> => api.getPlaceReachableRides(placeId, page, pageSize);

export const fetchPlaceReviews = async (placeId: string): Promise<ReviewDTO[]> => {
  const res = await api.getPlaceReviews(placeId);
  return res.data ?? [];
};

export const fetchPublicPlaceDetail = async (placeId: string): Promise<LocationDTO> => {
  const res = await api.getPublicPlaceDetail(placeId);
  return res.data;
};

export const fetchPublicPlaceDetailPayload = async (
  placeId: string
): Promise<LocationDetailResponse> => {
  // Signed-in path first: draft places are only readable by submitter / platform admin
  // (`GET /places/:id` with auth:false always 404s drafts).
  if (getStoredSession()) {
    try {
      return await api.getPublicPlaceMeState(placeId);
    } catch {
      /* fall through to public shell for active places if me/state fails */
    }
  }

  return api.getPublicPlaceDetail(placeId);
};
