import type {
  ActivityDTO,
  LocationDTO,
  LocationDetailResponse,
  ReviewDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';

export const trackPlaceDetailView = async (placeId: string): Promise<void> => {
  await api.trackPlaceView(placeId);
};

export const fetchPlaceActivities = async (placeId: string): Promise<ActivityDTO[]> => {
  const res = await api.getPlaceActivities(placeId);
  return res.data ?? [];
};

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
  return api.getPublicPlaceDetail(placeId);
};
