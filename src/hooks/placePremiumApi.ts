import type { LocationPremiumSummaryDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export type PlacePremiumCheckoutResult = {
  url?: string;
  premium?: LocationPremiumSummaryDTO;
};

export const startPlacePremiumCheckout = async (
  placeId: string
): Promise<PlacePremiumCheckoutResult> => {
  const response = await api.checkoutPlacePremium(placeId);
  return response.data;
};

export const downloadPlaceRouteMapFile = async (
  placeId: string
): Promise<{ blob: Blob; filename: string }> => api.downloadPlaceRouteMap(placeId);

export const downloadPlaceGuidePdfFile = async (
  placeId: string
): Promise<{ blob: Blob; filename: string }> => api.downloadPlaceGuidePdf(placeId);

export const fetchPlaceGuideMarkdown = async (placeId: string): Promise<string> => {
  const response = await api.getPlaceGuide(placeId);
  return response.data.markdown;
};
