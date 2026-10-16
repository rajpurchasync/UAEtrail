import { useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import type {
  ActivityDTO,
  LocationPremiumSummaryDTO,
  PlaceNearbyFacilityDTO,
  ReviewDTO,
} from '@uaetrail/shared-types';
import {
  fetchPlaceActivities,
  fetchPlaceReviews,
  trackPlaceDetailView,
} from './placeDetailClientApi';
import { fetchPlaceDetail } from './entityClientApi';
import type { Place } from '../types/place';
import {
  PLACE_DETAIL_CONFIG,
  resolvePlaceDetailKind,
  type PlaceDetailKind,
  type PlaceDetailKindConfig,
} from '../pages/placeDetailConfig';
import { useSafeAsyncEffect } from './useSafeAsyncEffect';

type Args = {
  /** When omitted, kind is resolved from loaded place `activityType` (canonical `/place/:id`). */
  kind?: PlaceDetailKind;
  placeId: string | undefined;
  config: PlaceDetailKindConfig;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
};

/** Load place, activities, reviews, and premium unlock return handling (R3). */
export const usePlaceDetailCore = ({
  kind: kindProp,
  placeId,
  config,
  searchParams,
  setSearchParams,
}: Args) => {
  const [resolvedKind, setResolvedKind] = useState<PlaceDetailKind | null>(null);
  const effectiveKind = kindProp ?? resolvedKind;
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityDTO[]>([]);
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [premium, setPremium] = useState<LocationPremiumSummaryDTO | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);
  const [nearbyFacilities, setNearbyFacilities] = useState<PlaceNearbyFacilityDTO[]>([]);

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
        let loaded: Place | null = null;
        if (placeResult.place) {
          if (kindProp) {
            loaded =
              placeResult.place.activityType === config.activityType ? placeResult.place : null;
          } else {
            const inferred = resolvePlaceDetailKind(placeResult.place.activityType);
            if (inferred) {
              setResolvedKind(inferred);
              const inferredConfig = PLACE_DETAIL_CONFIG[inferred];
              loaded =
                placeResult.place.activityType === inferredConfig.activityType
                  ? placeResult.place
                  : null;
            }
          }
        }
        setPlace(loaded);
        setPremium(placeResult.premium ?? null);
        setNearbyFacilities(placeResult.nearbyFacilities ?? []);
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
    [placeId, kindProp, config.activityType]
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
    resolvedKind: effectiveKind,
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
    nearbyFacilities,
  };
};
