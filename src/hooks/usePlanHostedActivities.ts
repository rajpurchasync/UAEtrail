import { useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { PlanHostingCountRange, PlanHostingScheduleLens } from '../plan/planHostingTimeRange';
import { planHostingListWindowQuery } from '../plan/planHostingTimeRange';
import {
  PLAN_HOSTING_OTHER_PAGE_SIZE,
  fetchPlanHostedActivitiesPage,
  type PublishingActivitiesPageMeta,
} from './planHostedActivitiesClientApi';

const hostedScheduleKey = (
  tenantId: string,
  range: PlanHostingScheduleLens,
  kind: 'list' | 'count'
) => ['plan-hosted-activities', tenantId, range, kind] as const;

const hostedCopyKey = (tenantId: string) => ['plan-hosted-copy', tenantId] as const;

const WEEK_MONTH_PAGE_SIZE = 50;

export const usePlanHostingRangeCounts = (
  tenantId: string | null,
  enabled: boolean,
  refreshKey = 0
) => {
  const ranges: PlanHostingScheduleLens[] = ['today', 'week', 'month', 'other'];
  const results = useQueries({
    queries: ranges.map((range) => ({
      queryKey: [...hostedScheduleKey(tenantId ?? '', range, 'count'), refreshKey],
      queryFn: async () => {
        const window = planHostingListWindowQuery(range);
        const page = await fetchPlanHostedActivitiesPage(tenantId!, {
          ...window,
          page: 1,
          pageSize: 1,
          status: 'published',
        });
        return page.meta.total;
      },
      enabled: enabled && Boolean(tenantId),
      staleTime: 30_000,
    })),
  });

  const loading = results.some((entry) => entry.isLoading || entry.isFetching);
  const counts: Record<PlanHostingCountRange, number> = {
    today: results[0]?.data ?? 0,
    week: results[1]?.data ?? 0,
    month: results[2]?.data ?? 0,
  };

  return { counts, laterCount: results[3]?.data ?? 0, loading };
};

export const usePlanHostedSchedule = (
  tenantId: string | null,
  timeRange: PlanHostingScheduleLens,
  enabled: boolean,
  refreshKey = 0
) => {
  const isOther = timeRange === 'other';

  const bounded = useQuery({
    queryKey: [...hostedScheduleKey(tenantId ?? '', timeRange, 'list'), refreshKey],
    queryFn: async () => {
      const window = planHostingListWindowQuery(timeRange);
      return fetchPlanHostedActivitiesPage(tenantId!, {
        ...window,
        page: 1,
        pageSize: WEEK_MONTH_PAGE_SIZE,
        status: 'published',
        order: 'asc',
      });
    },
    enabled: enabled && Boolean(tenantId) && !isOther,
    staleTime: 30_000,
  });

  const infinite = useInfiniteQuery({
    queryKey: [...hostedScheduleKey(tenantId ?? '', 'other', 'list'), refreshKey],
    queryFn: async ({ pageParam }) => {
      const window = planHostingListWindowQuery('other');
      return fetchPlanHostedActivitiesPage(tenantId!, {
        ...window,
        page: pageParam,
        pageSize: PLAN_HOSTING_OTHER_PAGE_SIZE,
        status: 'published',
        order: 'asc',
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: enabled && Boolean(tenantId) && isOther,
    staleTime: 30_000,
  });

  const activities: ActivityDTO[] = isOther
    ? (infinite.data?.pages.flatMap((page) => page.data) ?? [])
    : (bounded.data?.data ?? []);

  const meta: PublishingActivitiesPageMeta | null = isOther
    ? infinite.data?.pages[infinite.data.pages.length - 1]?.meta ?? null
    : bounded.data?.meta ?? null;

  const loading = isOther ? infinite.isLoading : bounded.isLoading;
  const error =
    (isOther ? infinite.error : bounded.error) instanceof Error
      ? (isOther ? infinite.error : bounded.error)?.message ?? 'Failed to load hosted outings'
      : isOther
        ? infinite.isError
          ? 'Failed to load hosted outings'
          : null
        : bounded.isError
          ? 'Failed to load hosted outings'
          : null;

  return {
    activities,
    meta,
    loading,
    error,
    loadMore: () => void infinite.fetchNextPage(),
    loadingMore: infinite.isFetchingNextPage,
    hasMore: isOther ? Boolean(infinite.hasNextPage) : false,
  };
};

/** Published outings for duplicate — tenant-scoped pages, not explore map. */
export const usePlanHostedCopySources = (
  tenantId: string | null,
  enabled: boolean,
  refreshKey = 0
) => {
  const infinite = useInfiniteQuery({
    queryKey: [...hostedCopyKey(tenantId ?? ''), refreshKey],
    queryFn: async ({ pageParam }) =>
      fetchPlanHostedActivitiesPage(tenantId!, {
        startAtGte: '1970-01-01',
        startAtLt: '2100-01-01',
        page: pageParam,
        pageSize: PLAN_HOSTING_OTHER_PAGE_SIZE,
        status: 'published',
        order: 'desc',
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: enabled && Boolean(tenantId),
    staleTime: 30_000,
  });

  const activities: ActivityDTO[] = infinite.data?.pages.flatMap((page) => page.data) ?? [];

  return {
    activities,
    loading: infinite.isLoading,
    error: infinite.isError ? 'Failed to load hosted outings' : null,
    loadMore: () => void infinite.fetchNextPage(),
    loadingMore: infinite.isFetchingNextPage,
    hasMore: Boolean(infinite.hasNextPage),
  };
};
