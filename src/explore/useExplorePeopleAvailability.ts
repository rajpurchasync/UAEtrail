import { useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AvailabilityKind } from '@uaetrail/shared-types';
import { fetchExplorePeopleAvailability } from '../hooks/memberPeopleClientApi';
import {
  explorePeopleAvailabilityQueryKey,
  type ExplorePeopleAvailabilityQueryParams,
} from './memberPeopleQueryKeys';
import {
  exploreActivityDatePresetToInclusiveRange,
  type ExploreActivityDatePreset,
} from './exploreActivityDateFilter';
import type { MapFilterKey } from './routing';

const STALE_MS = 60_000;

const mapFilterToAvailabilityKind = (mapFilter: MapFilterKey): AvailabilityKind | undefined => {
  if (mapFilter === 'hiking' || mapFilter === 'camping' || mapFilter === 'rideshare') {
    return mapFilter;
  }
  return undefined;
};

type UseExplorePeopleAvailabilityArgs = {
  enabled: boolean;
  search: string;
  activityDatePreset: ExploreActivityDatePreset;
  areaSlug?: string | null;
  mapFilter?: MapFilterKey;
};

export const useExplorePeopleAvailability = ({
  enabled,
  search,
  activityDatePreset,
  areaSlug,
  mapFilter = 'all',
}: UseExplorePeopleAvailabilityArgs) => {
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const range = exploreActivityDatePresetToInclusiveRange(activityDatePreset);
  const kind = mapFilterToAvailabilityKind(mapFilter);

  const queryParams: ExplorePeopleAvailabilityQueryParams = {
    from: range.from,
    to: range.to,
    area: areaSlug?.trim() || null,
    kind: kind ?? null,
  };

  const query = useQuery({
    queryKey: explorePeopleAvailabilityQueryKey(queryParams),
    enabled,
    staleTime: STALE_MS,
    queryFn: async () => {
      return fetchExplorePeopleAvailability({
        from: range.from,
        to: range.to,
        area: areaSlug?.trim() || undefined,
        kind: kind ?? undefined,
      });
    },
  });

  const people = (query.data?.people ?? []).filter((person) => {
    if (!deferredSearch) return true;
    return person.displayName.toLowerCase().includes(deferredSearch);
  });

  return {
    people,
    clusters: query.data?.clusters ?? [],
    range,
    loading: query.isLoading,
    error: query.error ? (query.error instanceof Error ? query.error.message : 'Could not load availability') : null,
    refresh: query.refetch,
  };
};
