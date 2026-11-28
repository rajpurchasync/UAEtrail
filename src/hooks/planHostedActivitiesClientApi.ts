import type { ActivityDTO } from '@uaetrail/shared-types';
import type { PlanHostingListWindowQuery } from '../plan/planHostingTimeRange';
import { apiRequest } from '../api/client';
import { tenantScopeHeaders } from '../api/tenantScopeHeaders';

export const PLAN_HOSTING_OTHER_PAGE_SIZE = 20;

export type PublishingActivitiesPageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PublishingActivitiesPage = {
  data: ActivityDTO[];
  meta: PublishingActivitiesPageMeta;
};

export type HostedActivitiesListParams = PlanHostingListWindowQuery & {
  page?: number;
  pageSize?: number;
  order?: 'asc' | 'desc';
  status?: 'published';
};

const buildHostedActivitiesQuery = (params: HostedActivitiesListParams): string => {
  const search = new URLSearchParams();
  search.set('page', String(params.page ?? 1));
  search.set('pageSize', String(params.pageSize ?? PLAN_HOSTING_OTHER_PAGE_SIZE));
  if (params.status) search.set('status', params.status);
  if (params.order) search.set('order', params.order);
  search.set('startAtGte', params.startAtGte);
  search.set('startAtLt', params.startAtLt);
  if (params.windowOutside) search.set('windowOutside', '1');
  if (params.upcomingFromToday) search.set('upcomingFromToday', '1');
  return search.toString();
};

export const fetchPlanHostedActivitiesPage = async (
  tenantId: string,
  params: HostedActivitiesListParams
): Promise<PublishingActivitiesPage> => {
  const qs = buildHostedActivitiesQuery(params);
  const res = await apiRequest<{
    data: ActivityDTO[];
    meta?: PublishingActivitiesPageMeta;
  }>(`/workspace/activities?${qs}`, {
    auth: true,
    headers: tenantScopeHeaders(tenantId),
  });
  const meta = res.meta ?? {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? PLAN_HOSTING_OTHER_PAGE_SIZE,
    total: res.data.length,
    totalPages: 1,
  };
  return { data: res.data, meta };
};
