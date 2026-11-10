import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Settings2, SlidersHorizontal, UserCircle } from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useConsoleHubData } from '../../console/useHubData';
import { useHostActivityManageActions } from '../../hooks/useHostActivityManageActions';
import { useMySeekingPosts } from '../../hooks/useMySeekingPosts';
import {
  usePlanHostedCopySources,
  usePlanHostedSchedule,
  usePlanHostingRangeCounts,
} from '../../hooks/usePlanHostedActivities';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../mobile/ConsumerFeedback';
import { HostedActivityListRow } from '../activity/HostedActivityListRow';
import { ActivityManageSheet } from '../activity/ActivityManageSheet';
import { PlanNeedsYouStrip } from './PlanNeedsYouStrip';
import { PlanHostingUpcoming } from './PlanHostingUpcoming';
import { resolveJoinRequestActivity } from '../../utils/joinRequestActivity';
import type { ActivityRequestView } from '../../api/types';
import { matchesActivitySearch } from '../../utils/activitySearch';
import type { PlanHostingScheduleLens } from '../../plan/planHostingTimeRange';
import {
  MY_REQUESTS_PATH,
  PROFILE_EDIT_PATH,
  exploreHostPath,
  planAvailabilityPath,
} from '../../config/routingCatalog';
import { PRODUCT_PLAN_UPCOMING_HOSTING_CONTEXT } from '../../content/productNorthStar';

const pendingCountForActivity = (activityId: string, requests: ActivityRequestView[]) =>
  requests.filter((request) => {
    if (request.status !== 'pending') return false;
    return resolveJoinRequestActivity(request)?.id === activityId;
  }).length;

const COUNT_CHIPS: { key: PlanHostingScheduleLens; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'other', label: 'Later' },
];

type PlanDesktopHostingHubProps = {
  refreshKey: number;
  onCreateNew: () => void;
};

/**
 * Desktop `/plan?filter=hosting` — hosting workspace only (no joined / wishlist / summary strip).
 * Activity rows load via tenant-scoped `/publishing/activities` date windows, not explore map payloads.
 */
export const PlanDesktopHostingHub = ({ refreshKey, onCreateNew }: PlanDesktopHostingHubProps) => {
  const navigate = useNavigate();
  const host = useConsoleHubData(true, { fetchActivities: false });
  const hostActions = useHostActivityManageActions(host.tenantId, host.reload);
  const {
    loading: intentsLoading,
    refetch: refetchIntents,
  } = useMySeekingPosts(true, refreshKey);

  const [timeRange, setTimeRange] = useState<PlanHostingScheduleLens>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [manageActivity, setManageActivity] = useState<ActivityDTO | null>(null);
  const [manageInitialView, setManageInitialView] = useState<'overview' | 'checkin'>('overview');

  const scheduleQuery = usePlanHostedSchedule(host.tenantId, timeRange, Boolean(host.tenantId), refreshKey);
  const copyQuery = usePlanHostedCopySources(host.tenantId, Boolean(host.tenantId), refreshKey);
  const rangeCounts = usePlanHostingRangeCounts(host.tenantId, Boolean(host.tenantId), refreshKey);

  useEffect(() => {
    if (!refreshKey) return;
    void host.reload();
    void refetchIntents();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when refreshKey bumps
  }, [refreshKey, host.reload, refetchIntents]);

  const filterBySearch = useCallback(
    (pool: ActivityDTO[]) => {
      const q = searchQuery.trim();
      if (!q) return pool;
      return pool.filter((event) =>
        matchesActivitySearch(q, event.title, event.locationName, formatActivityTypeForSearch(event))
      );
    },
    [searchQuery]
  );

  const scheduleActivities = useMemo(
    () => filterBySearch(scheduleQuery.activities),
    [filterBySearch, scheduleQuery.activities]
  );

  const copySourceActivities = useMemo(
    () => filterBySearch(copyQuery.activities),
    [copyQuery.activities, filterBySearch]
  );

  const scheduleIds = useMemo(
    () => new Set(scheduleActivities.map((activity) => activity.id)),
    [scheduleActivities]
  );

  const duplicateFromPast = useMemo(
    () => copySourceActivities.filter((activity) => !scheduleIds.has(activity.id)).slice(0, 8),
    [copySourceActivities, scheduleIds]
  );

  const openManage = useCallback((activity: ActivityDTO, view: 'overview' | 'checkin' = 'overview') => {
    setManageInitialView(view);
    setManageActivity(activity);
  }, []);

  const queueLoading = host.loading;
  const scheduleLoading = scheduleQuery.loading;
  const pageLoading = queueLoading || intentsLoading || (scheduleLoading && scheduleActivities.length === 0);

  const countForChip = (key: PlanHostingScheduleLens): number | '…' => {
    if (rangeCounts.loading) return '…';
    if (key === 'other') return rangeCounts.laterCount;
    return rangeCounts.counts[key];
  };

  if (pageLoading) {
    return <ConsumerLoadingSpinner className="py-16" />;
  }

  if (host.error) {
    return <ConsumerErrorCard message={host.error} />;
  }

  if (scheduleQuery.error) {
    return <ConsumerErrorCard message={scheduleQuery.error} />;
  }

  if (!host.tenantId) {
    return (
      <ConsumerInlineEmpty
        message="Host profile is still loading — try again in a moment."
        actionLabel="Refresh"
        actionTo="/plan?view=plans&filter=hosting"
      />
    );
  }

  const showDuplicatePast = !searchQuery.trim() && duplicateFromPast.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm leading-snug text-neutral-600">{PRODUCT_PLAN_UPCOMING_HOSTING_CONTEXT}</p>
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Create new outing
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink to={PROFILE_EDIT_PATH} icon={UserCircle} label="Hosting profile" />
        <QuickLink to={planAvailabilityPath()} icon={SlidersHorizontal} label="Find-crew availability" />
        <QuickLink to={MY_REQUESTS_PATH} icon={Settings2} label="Join requests" />
        <QuickLink to={exploreHostPath()} icon={Plus} label="Host on the map" />
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search outings you host…"
          aria-label="Search hosted outings"
          className="w-full rounded-xl border border-neutral-200/80 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 shadow-sm outline-none ring-emerald-600/30 placeholder:text-neutral-400 focus:ring-2"
        />
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Hosted outings overview counts" role="tablist">
        {COUNT_CHIPS.map((chip) => {
          const selected = chip.key === timeRange;
          return (
            <button
              key={chip.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTimeRange(chip.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                selected
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                  : 'border-neutral-200/80 bg-white text-neutral-600 hover:border-neutral-300'
              }`}
            >
              <span>{chip.label}</span>
              <span className="tabular-nums text-neutral-900">{countForChip(chip.key)}</span>
            </button>
          );
        })}
      </div>

      <PlanNeedsYouStrip refreshKey={refreshKey} />

      <section aria-labelledby="plan-hosting-schedule-heading" className="min-w-0 space-y-2">
        <h2 id="plan-hosting-schedule-heading" className="px-1 text-sm font-bold text-neutral-800">
          Your hosting schedule
        </h2>
        {scheduleLoading && scheduleActivities.length === 0 ? (
          <ConsumerLoadingSpinner className="py-8" />
        ) : scheduleActivities.length === 0 ? (
          <ConsumerInlineEmpty
            message={
              searchQuery.trim()
                ? 'No hosted outings match your search in this window.'
                : 'Nothing on the calendar for this window yet.'
            }
            action={
              <button
                type="button"
                onClick={onCreateNew}
                className="mt-2 text-sm font-semibold text-emerald-700"
              >
                Create new outing
              </button>
            }
          />
        ) : (
          <>
            {scheduleActivities.map((activity) => (
              <HostedActivityListRow
                key={activity.id}
                activity={activity}
                layout="desktop-actions"
                pendingRequestCount={pendingCountForActivity(activity.id, host.pendingRequests)}
                onOpenDetail={() => openManage(activity)}
                onDuplicate={() => void hostActions.duplicateActivity(activity)}
              />
            ))}
            {timeRange === 'other' && scheduleQuery.hasMore ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => scheduleQuery.loadMore()}
                  disabled={scheduleQuery.loadingMore}
                  className="text-sm font-semibold text-emerald-700 disabled:opacity-60"
                >
                  {scheduleQuery.loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            ) : null}
          </>
        )}

        {showDuplicatePast ? (
          <div className="space-y-2 border-t border-neutral-200/80 pt-4">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Duplicate from a past outing
            </p>
            {duplicateFromPast.map((activity) => (
              <HostedActivityListRow
                key={`dup-${activity.id}`}
                activity={activity}
                layout="desktop-actions"
                pendingRequestCount={pendingCountForActivity(activity.id, host.pendingRequests)}
                onOpenDetail={() => openManage(activity)}
                onDuplicate={() => void hostActions.duplicateActivity(activity)}
              />
            ))}
            {copyQuery.hasMore ? (
              <button
                type="button"
                onClick={() => copyQuery.loadMore()}
                disabled={copyQuery.loadingMore}
                className="text-sm font-semibold text-emerald-700 disabled:opacity-60"
              >
                {copyQuery.loadingMore ? 'Loading…' : 'Show more past outings'}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section aria-labelledby="plan-hosting-seeking-heading" className="space-y-2">
        <h2 id="plan-hosting-seeking-heading" className="px-1 text-sm font-bold text-neutral-800">
          Open &ldquo;find company&rdquo; posts
        </h2>
        <PlanHostingUpcoming refreshKey={refreshKey} canHost intentsOnly scopedJoinQueue />
      </section>

      {hostActions.error && <ConsumerErrorCard message={hostActions.error} />}

      <ActivityManageSheet
        open={Boolean(manageActivity)}
        activity={manageActivity}
        tenantId={host.tenantId}
        pendingRequests={host.pendingRequests}
        actions={hostActions}
        initialView={manageInitialView}
        onOpenPublicPage={(activity) => navigate(`/activity/${activity.id}`)}
        onClose={() => {
          setManageActivity(null);
          setManageInitialView('overview');
        }}
        onRequestsChanged={host.reload}
      />
    </div>
  );
};

function formatActivityTypeForSearch(activity: ActivityDTO): string {
  return activity.activityType ?? '';
}

const QuickLink = ({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof UserCircle;
  label: string;
}) => (
  <Link
    to={to}
    className="glass-card-interactive flex min-h-[3.25rem] items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-neutral-800"
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
      <Icon className="h-4 w-4" aria-hidden />
    </span>
    <span className="min-w-0 truncate">{label}</span>
  </Link>
);
