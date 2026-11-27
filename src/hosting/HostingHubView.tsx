import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  History,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  UserCircle,
  Users,
  UsersRound,
} from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useConsoleHubData } from '../operator/desk/useHubData';
import { useHostActivityManageActions } from '../hooks/useHostActivityManageActions';
import {
  usePlanHostedPastPreview,
  usePlanHostedSchedule,
  usePlanHostingRangeCounts,
} from '../hooks/usePlanHostedActivities';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../components/mobile/ConsumerFeedback';
import { HostedActivityListRow } from '../components/activity/HostedActivityListRow';
import { ActivityManageSheet } from '../components/activity/ActivityManageSheet';
import type { ActivityMapPeekActionHandlers } from '../activity/executeActivityMapPeekAction';
import { useActivityInviteShareSheet } from '../hooks/useActivityInviteShareSheet';
import { PlanNeedsYouStrip } from '../components/plan/PlanNeedsYouStrip';
import { resolveJoinRequestActivity } from '../utils/joinRequestActivity';
import type { ActivityRequestView } from '../api/types';
import { matchesActivitySearch } from '../utils/activitySearch';
import type { PlanHostingScheduleLens } from '../plan/planHostingTimeRange';
import {
  MEMBER_SCHEDULE_CALENDAR_PATH,
  OPERATOR_OVERVIEW_PATH,
  MESSAGES_PATH,
  OPERATOR_ACTIVITIES_PATH,
  OPERATOR_HISTORY_PATH,
  OPERATOR_PLACES_PATH,
  OPERATOR_PROFILE_PATH,
  OPERATOR_REQUESTS_PATH,
  OPERATOR_TEAM_PATH,
} from '../config/routingCatalog';
import {
  PRODUCT_HOSTING_SCHEDULE_NAV_HINT,
  PRODUCT_PLAN_UPCOMING_HOSTING_CONTEXT,
} from '../content/productNorthStar';
import {
  AccountLinkList,
  AccountSectionHeader,
  AccountStatGrid,
  type AccountStat,
} from '../components/account';

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

type HostingHubViewProps = {
  refreshKey: number;
  onCreateNew: () => void;
};

/**
 * Community host schedule on `/operator/overview` — hosting workspace only
 * (upcoming, approvals, chat, manage, history — not My Plans).
 */
export const HostingHubView = ({ refreshKey, onCreateNew }: HostingHubViewProps) => {
  const navigate = useNavigate();
  // Join queue only — schedule / counts / past use scoped queries (no full tenant dump).
  const host = useConsoleHubData(true, { fetchActivities: false });
  const hostActions = useHostActivityManageActions(host.tenantId, host.reload);
  const inviteShare = useActivityInviteShareSheet();

  const [timeRange, setTimeRange] = useState<PlanHostingScheduleLens>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [manageActivity, setManageActivity] = useState<ActivityDTO | null>(null);
  const [manageInitialView, setManageInitialView] = useState<'overview' | 'checkin'>('overview');
  const [pastPreviewEnabled, setPastPreviewEnabled] = useState(false);

  const scheduleQuery = usePlanHostedSchedule(host.tenantId, timeRange, Boolean(host.tenantId), refreshKey);
  const rangeCounts = usePlanHostingRangeCounts(host.tenantId, Boolean(host.tenantId), refreshKey);

  // Defer past strip until primary schedule has settled — keeps first paint light.
  useEffect(() => {
    if (!host.tenantId || scheduleQuery.loading) return;
    setPastPreviewEnabled(true);
  }, [host.tenantId, scheduleQuery.loading]);

  const pastPreview = usePlanHostedPastPreview(
    host.tenantId,
    pastPreviewEnabled && Boolean(host.tenantId),
    refreshKey
  );

  useEffect(() => {
    if (!refreshKey) return;
    void host.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when refreshKey bumps
  }, [refreshKey, host.reload]);

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

  const pastTrips = useMemo(
    () => filterBySearch(pastPreview.activities),
    [filterBySearch, pastPreview.activities]
  );

  // Month + later are complementary windows (both upcomingFromToday) — don't sum today/week chips.
  const upcomingCount = useMemo(() => {
    if (rangeCounts.loading) return 0;
    return rangeCounts.counts.month + rangeCounts.laterCount;
  }, [rangeCounts]);

  const openManage = useCallback((activity: ActivityDTO, view: 'overview' | 'checkin' = 'overview') => {
    setManageInitialView(view);
    setManageActivity(activity);
  }, []);

  const mapPeekHandlersFor = useCallback(
    (activity: ActivityDTO): ActivityMapPeekActionHandlers => ({
      shareActivity: () =>
        inviteShare.openShareFromActivity(activity, { canSendFriendInvites: true }),
      manageActivity: () => openManage(activity),
      openCrewChat: () =>
        void hostActions.openGroupChat(activity.id, activity.groupChatId, {
          returnTo: OPERATOR_OVERVIEW_PATH,
        }),
    }),
    [hostActions, inviteShare, openManage]
  );

  const queueLoading = host.loading;
  const scheduleLoading = scheduleQuery.loading;
  const pageLoading = queueLoading || (scheduleLoading && scheduleActivities.length === 0);

  const countForChip = (key: PlanHostingScheduleLens): number | '…' => {
    if (rangeCounts.loading) return '…';
    if (key === 'other') return rangeCounts.laterCount;
    return rangeCounts.counts[key];
  };

  const hubStats: AccountStat[] = useMemo(
    () => [
      {
        label: 'Upcoming',
        value: upcomingCount,
        to: OPERATOR_ACTIVITIES_PATH,
        highlight: upcomingCount > 0,
      },
      {
        label: 'Pending',
        value: host.pendingJoinRequests,
        to: OPERATOR_REQUESTS_PATH,
        highlight: host.pendingJoinRequests > 0,
        tone: 'amber',
      },
      {
        label: 'This week',
        value: rangeCounts.loading ? 0 : rangeCounts.counts.week,
        to: OPERATOR_ACTIVITIES_PATH,
        highlight: !rangeCounts.loading && rangeCounts.counts.week > 0,
      },
      {
        label: 'History',
        value: pastPreview.total,
        to: OPERATOR_HISTORY_PATH,
      },
    ],
    [
      host.pendingJoinRequests,
      pastPreview.total,
      rangeCounts.counts.week,
      rangeCounts.loading,
      upcomingCount,
    ]
  );

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
        actionTo={OPERATOR_OVERVIEW_PATH}
      />
    );
  }

  const showPastTrips = !searchQuery.trim() && pastTrips.length > 0;

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1 px-0.5">
          <p className="text-sm font-semibold text-neutral-900 md:text-[15px]">
            {PRODUCT_HOSTING_SCHEDULE_NAV_HINT}
          </p>
          <p className="text-xs leading-snug text-neutral-500 md:text-sm">
            {PRODUCT_PLAN_UPCOMING_HOSTING_CONTEXT}
          </p>
        </div>
        <button type="button" onClick={onCreateNew} className="app-cta-sm shrink-0 self-stretch sm:self-auto">
          <Plus className="h-4 w-4" aria-hidden />
          Create outing
        </button>
      </div>

      <AccountStatGrid stats={hubStats} />

      <PlanNeedsYouStrip refreshKey={refreshKey} />

      <section aria-labelledby="plan-hosting-tools-heading" className="space-y-2">
        <AccountSectionHeader title="Host tools" />
        <h2 id="plan-hosting-tools-heading" className="sr-only">
          Host tools
        </h2>
        <AccountLinkList
          items={[
            {
              to: MEMBER_SCHEDULE_CALENDAR_PATH,
              icon: <CalendarDays className="h-4 w-4" />,
              label: 'My calendar',
              accent: 'emerald',
            },
            {
              to: OPERATOR_REQUESTS_PATH,
              icon: <Users className="h-4 w-4" />,
              label: 'Approvals',
              badge: host.pendingJoinRequests || undefined,
              accent: 'amber',
            },
            {
              to: MESSAGES_PATH,
              icon: <MessageSquare className="h-4 w-4" />,
              label: 'Chat groups',
            },
            {
              to: OPERATOR_ACTIVITIES_PATH,
              icon: <CalendarDays className="h-4 w-4" />,
              label: 'Manage trips',
              accent: 'emerald',
            },
            {
              to: OPERATOR_HISTORY_PATH,
              icon: <History className="h-4 w-4" />,
              label: 'Past trips',
            },
            {
              to: OPERATOR_PROFILE_PATH,
              icon: <UserCircle className="h-4 w-4" />,
              label: 'Public profile',
              accent: 'emerald',
            },
            {
              to: OPERATOR_PLACES_PATH,
              icon: <MapPin className="h-4 w-4" />,
              label: 'Submit a place',
              accent: 'blue',
            },
            {
              to: OPERATOR_TEAM_PATH,
              icon: <UsersRound className="h-4 w-4" />,
              label: 'Manage team',
            },
          ]}
        />
      </section>

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
          className="w-full rounded-xl border border-neutral-200/80 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 shadow-sm outline-none ring-emerald-600/30 placeholder:text-neutral-400 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-0.5 desktop-scrollbar-x"
        aria-label="Hosted outings overview counts"
        role="tablist"
      >
        {COUNT_CHIPS.map((chip) => {
          const selected = chip.key === timeRange;
          return (
            <button
              key={chip.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTimeRange(chip.key)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                selected
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
                  : 'border-neutral-200/80 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
              }`}
            >
              <span>{chip.label}</span>
              <span className="tabular-nums text-neutral-900 dark:text-neutral-100">{countForChip(chip.key)}</span>
            </button>
          );
        })}
      </div>

      <section aria-labelledby="plan-hosting-schedule-heading" className="min-w-0 space-y-2">
        <AccountSectionHeader
          title="Upcoming schedule"
          actionTo={OPERATOR_ACTIVITIES_PATH}
          actionLabel="Manage all"
        />
        <h2 id="plan-hosting-schedule-heading" className="sr-only">
          Upcoming schedule
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
            <div className="app-zebra space-y-2">
              {scheduleActivities.map((activity) => (
                <HostedActivityListRow
                  key={activity.id}
                  activity={activity}
                  layout="desktop-actions"
                  pendingRequestCount={pendingCountForActivity(activity.id, host.pendingRequests)}
                  onOpenDetail={() => openManage(activity)}
                  mapPeekHandlers={mapPeekHandlersFor(activity)}
                  onDuplicate={() => void hostActions.duplicateActivity(activity)}
                />
              ))}
            </div>
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
      </section>

      <section aria-labelledby="plan-hosting-history-heading" className="min-w-0 space-y-2">
        <AccountSectionHeader
          title="Past trips"
          actionTo={OPERATOR_HISTORY_PATH}
          actionLabel="Full history"
        />
        <h2 id="plan-hosting-history-heading" className="sr-only">
          Past trips
        </h2>
        {showPastTrips ? (
          <>
            <div className="app-zebra space-y-2">
              {pastTrips.map((activity) => (
                <HostedActivityListRow
                  key={`past-${activity.id}`}
                  activity={activity}
                  layout="desktop-actions"
                  pendingRequestCount={pendingCountForActivity(activity.id, host.pendingRequests)}
                  onOpenDetail={() => openManage(activity)}
                  mapPeekHandlers={mapPeekHandlersFor(activity)}
                  onDuplicate={() => void hostActions.duplicateActivity(activity)}
                />
              ))}
            </div>
            <Link
              to={OPERATOR_HISTORY_PATH}
              className="inline-flex text-sm font-semibold text-emerald-700"
            >
              Open full history
            </Link>
          </>
        ) : pastPreview.loading ? (
          <ConsumerLoadingSpinner className="py-6" />
        ) : (
          <ConsumerInlineEmpty
            message={
              searchQuery.trim()
                ? 'No past trips match your search.'
                : pastPreview.total > 0
                  ? 'Open full history for check-ins and past outing details.'
                  : 'Past hosted outings will show up here.'
            }
            actionLabel={pastPreview.total > 0 ? 'Full history' : undefined}
            actionTo={pastPreview.total > 0 ? OPERATOR_HISTORY_PATH : undefined}
          />
        )}
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
