import { useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import type { ActivityDTO, LocationPremiumSummaryDTO, ReviewDTO } from '@uaetrail/shared-types';
import {
  fetchPlaceActivities,
  fetchPlaceReviews,
  trackPlaceDetailView,
} from './placeDetailClientApi';
import { fetchPlaceDetail } from './entityClientApi';
import type { Place } from '../types/place';
import type { PlaceDetailKind, PlaceDetailKindConfig } from '../pages/placeDetailConfig';
import { useSafeAsyncEffect } from './useSafeAsyncEffect';

type Args = {
  kind: PlaceDetailKind;
  placeId: string | undefined;
  config: PlaceDetailKindConfig;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
};

/** Load place, activities, reviews, and premium unlock return handling (R3). */
export const usePlaceDetailCore = ({
  kind,
  placeId,
  config,
  searchParams,
  setSearchParams,
}: Args) => {
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityDTO[]>([]);
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [premium, setPremium] = useState<LocationPremiumSummaryDTO | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);

  useSafeAsyncEffect(
    async (isActive) => {
      if (!placeId) return;
      void trackPlaceDetailView(placeId).catch(() => undefined);
      if (isActive()) {
        setLoading(true);
      }
      try {
        const [placeResult, placeActivities, placeReviews] = await Promise.all([
          fetchPlaceDetail(placeId),
          fetchPlaceActivities(placeId).catch(() => []),
          fetchPlaceReviews(placeId).catch(() => []),
        ]);
        if (!isActive()) return;
        const loaded =
          placeResult.place?.activityType === config.activityType ? placeResult.place : null;
        setPlace(loaded);
        setPremium(placeResult.premium ?? null);
        setActivities(placeActivities);
        setReviews(placeReviews);
      } catch {
        if (isActive()) {
          setPlace(null);
        }
      } finally {
        if (isActive()) {
          setLoading(false);
        }
      }
    },
    [placeId, kind, config.activityType]
  );

  useSafeAsyncEffect(
    async (isActive) => {
      if (!placeId) return;
      const unlock = searchParams.get('unlock');
      if (!unlock) return;

      const next = new URLSearchParams(searchParams);
      next.delete('unlock');
      setSearchParams(next, { replace: true });

      if (unlock === 'success') {
        if (isActive()) {
          setUnlockNotice('Premium guide unlocked. Your route map and guide are ready below.');
        }
        try {
          const result = await fetchPlaceDetail(placeId);
          if (isActive() && result.premium) {
            setPremium(result.premium);
          }
        } catch {
          // keep prior premium state
        }
        return;
      }

      if (unlock === 'cancelled' && isActive()) {
        setUnlockNotice('Checkout cancelled. You can unlock anytime from the Guided information tab.');
      }
    },
    [placeId, searchParams, setSearchParams]
  );

  return {
    place,
    loading,
    activities,
    reviews,
    premium,
    setPremium,
    selectedImage,
    setSelectedImage,
    unlockNotice,
    setUnlockNotice,
    setReviews,
  };
};
