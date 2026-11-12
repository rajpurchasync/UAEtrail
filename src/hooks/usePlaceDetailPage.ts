import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SetURLSearchParams } from 'react-router-dom';
import type {
  ActivityDTO,
  LocationPremiumSummaryDTO,
  PlaceNearbyFacilityDTO,
  ReviewDTO,
} from '@uaetrail/shared-types';
import { placeDetailPath } from '@uaetrail/shared-types';
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
import { placeDetailCoreQueryKey } from './clientQueryKeys';
import { useAuth } from '../context/AuthContext';

type Args = {
  /** When omitted, kind is resolved from loaded place `activityType` (canonical `/place/:id`). */
  kind?: PlaceDetailKind;
  placeId: string | undefined;
  config: PlaceDetailKindConfig;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
};

type PlaceDetailCorePayload = {
  placeResult: Awaited<ReturnType<typeof fetchPlaceDetail>>;
  activities: ActivityDTO[];
  reviews: ReviewDTO[];
};

const resolveLoadedPlace = (
  placeResult: PlaceDetailCorePayload['placeResult'],
  kindProp: PlaceDetailKind | undefined,
  config: PlaceDetailKindConfig
): {
  place: Place | null;
  resolvedKind: PlaceDetailKind | null;
  /** Typed URL was wrong (e.g. camp opened as `/venue/:id`) — go to the canonical path. */
  kindRedirectPath: string | null;
} => {
  if (!placeResult.place) {
    return { place: null, resolvedKind: null, kindRedirectPath: null };
  }
  const inferred = resolvePlaceDetailKind(placeResult.place.activityType);
  if (kindProp) {
    if (placeResult.place.activityType === config.activityType) {
      return { place: placeResult.place, resolvedKind: kindProp, kindRedirectPath: null };
    }
    if (inferred) {
      return {
        place: null,
        resolvedKind: null,
        kindRedirectPath: placeDetailPath(placeResult.place.activityType, placeResult.place.id),
      };
    }
    return { place: null, resolvedKind: null, kindRedirectPath: null };
  }
  if (!inferred) {
    return { place: null, resolvedKind: null, kindRedirectPath: null };
  }
  const inferredConfig = PLACE_DETAIL_CONFIG[inferred];
  const place =
    placeResult.place.activityType === inferredConfig.activityType ? placeResult.place : null;
  return { place, resolvedKind: inferred, kindRedirectPath: null };
};

/** Load place, activities, reviews, and premium unlock return handling (R3). */
export const usePlaceDetailCore = ({
  kind: kindProp,
  placeId,
  config,
  searchParams,
  setSearchParams,
}: Args) => {
  const { initializing: authInitializing } = useAuth();
  const queryClient = useQueryClient();
  const scope = `${kindProp ?? 'auto'}:${config.activityType}`;
  const [resolvedKind, setResolvedKind] = useState<PlaceDetailKind | null>(null);
  const effectiveKind = kindProp ?? resolvedKind;
  const [selectedImage, setSelectedImage] = useState(0);
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);

  const query = useQuery({
    queryKey: placeId ? placeDetailCoreQueryKey(placeId, scope) : ['place-detail-core', '', scope],
    queryFn: async (): Promise<PlaceDetailCorePayload> => {
      void trackPlaceDetailView(placeId!).catch(() => undefined);
      const [placeResult, placeActivities, placeReviews] = await Promise.all([
        fetchPlaceDetail(placeId!),
        fetchPlaceActivities(placeId!).catch(() => []),
        fetchPlaceReviews(placeId!).catch(() => []),
      ]);
      return { placeResult, activities: placeActivities, reviews: placeReviews };
    },
    // Wait for refresh-cookie bootstrap so draft submitter/admin preview is not raced as a guest 404.
    enabled: Boolean(placeId) && !authInitializing,
    staleTime: 60_000,
  });

  const derived = useMemo(() => {
    if (!query.data) {
      return {
        place: null as Place | null,
        premium: null as LocationPremiumSummaryDTO | null,
        nearbyFacilities: [] as PlaceNearbyFacilityDTO[],
        activities: [] as ActivityDTO[],
        reviews: [] as ReviewDTO[],
        inferredKind: null as PlaceDetailKind | null,
        kindRedirectPath: null as string | null,
      };
    }
    const { place, resolvedKind: inferredKind, kindRedirectPath } = resolveLoadedPlace(
      query.data.placeResult,
      kindProp,
      config
    );
    return {
      place,
      premium: query.data.placeResult.premium ?? null,
      nearbyFacilities: query.data.placeResult.nearbyFacilities ?? [],
      activities: query.data.activities,
      reviews: query.data.reviews,
      inferredKind,
      kindRedirectPath,
    };
  }, [query.data, kindProp, config]);

  useEffect(() => {
    if (derived.inferredKind) {
      setResolvedKind(derived.inferredKind);
    }
  }, [derived.inferredKind]);

  useEffect(() => {
    if (!placeId) return;
    const unlock = searchParams.get('unlock');
    if (!unlock) return;

    const next = new URLSearchParams(searchParams);
    next.delete('unlock');
    setSearchParams(next, { replace: true });

    if (unlock === 'success') {
      setUnlockNotice('Premium guide unlocked. Your route map and guide are ready below.');
      void fetchPlaceDetail(placeId)
        .then((result) => {
          if (!result.premium || !placeId) return;
          queryClient.setQueryData<PlaceDetailCorePayload>(
            placeDetailCoreQueryKey(placeId, scope),
            (old) =>
              old
                ? { ...old, placeResult: { ...old.placeResult, premium: result.premium } }
                : old
          );
        })
        .catch(() => undefined);
      return;
    }

    if (unlock === 'cancelled') {
      setUnlockNotice('Checkout cancelled. You can unlock anytime from the Guided information tab.');
    }
  }, [placeId, queryClient, scope, searchParams, setSearchParams]);

  const setPremium = (next: LocationPremiumSummaryDTO | null) => {
    if (!placeId) return;
    queryClient.setQueryData<PlaceDetailCorePayload>(
      placeDetailCoreQueryKey(placeId, scope),
      (old) =>
        old
          ? { ...old, placeResult: { ...old.placeResult, premium: next } }
          : old
    );
  };

  const setReviews = (updater: ReviewDTO[] | ((prev: ReviewDTO[]) => ReviewDTO[])) => {
    if (!placeId) return;
    queryClient.setQueryData<PlaceDetailCorePayload>(
      placeDetailCoreQueryKey(placeId, scope),
      (old) => {
        if (!old) return old;
        const nextReviews =
          typeof updater === 'function' ? updater(old.reviews) : updater;
        return { ...old, reviews: nextReviews };
      }
    );
  };

  return {
    resolvedKind: effectiveKind,
    place: derived.place,
    kindRedirectPath: derived.kindRedirectPath,
    loading: Boolean(placeId) && (authInitializing || query.isLoading),
    error: query.isError ? (query.error instanceof Error ? query.error.message : 'Could not load this place.') : null,
    reload: () => void query.refetch(),
    activities: derived.activities,
    reviews: derived.reviews,
    premium: derived.premium,
    setPremium,
    selectedImage,
    setSelectedImage,
    unlockNotice,
    setUnlockNotice,
    setReviews,
    nearbyFacilities: derived.nearbyFacilities,
  };
};
