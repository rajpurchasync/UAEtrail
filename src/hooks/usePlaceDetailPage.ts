import { useEffect, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import type { ActivityDTO, LocationPremiumSummaryDTO, ReviewDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { fetchPlaceDetail } from '../api/public';
import type { Place } from '../types/place';
import type { PlaceDetailKind, PlaceDetailKindConfig } from '../pages/placeDetailConfig';

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

  useEffect(() => {
    if (!placeId) return;
    api.trackPlaceView(placeId).catch(() => undefined);
    setLoading(true);
    Promise.all([
      fetchPlaceDetail(placeId),
      api.getPlaceActivities(placeId).catch(() => ({ data: [] })),
      api.getPlaceReviews(placeId).catch(() => ({ data: [] })),
    ])
      .then(([placeResult, eventsRes, reviewsRes]) => {
        const loaded =
          placeResult.place?.activityType === config.activityType ? placeResult.place : null;
        setPlace(loaded);
        setPremium(placeResult.premium ?? null);
        setActivities(eventsRes.data);
        setReviews(reviewsRes.data);
      })
      .catch(() => setPlace(null))
      .finally(() => setLoading(false));
  }, [placeId, kind, config.activityType]);

  useEffect(() => {
    if (!placeId) return;
    const unlock = searchParams.get('unlock');
    if (!unlock) return;

    const next = new URLSearchParams(searchParams);
    next.delete('unlock');
    setSearchParams(next, { replace: true });

    if (unlock === 'success') {
      setUnlockNotice('Premium guide unlocked. Your route map and guide are ready below.');
      fetchPlaceDetail(placeId)
        .then((result) => {
          if (result.premium) setPremium(result.premium);
        })
        .catch(() => undefined);
      return;
    }

    if (unlock === 'cancelled') {
      setUnlockNotice('Checkout cancelled. You can unlock anytime from the Guided information tab.');
    }
  }, [placeId, searchParams, setSearchParams]);

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
