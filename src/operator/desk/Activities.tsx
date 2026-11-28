import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search } from 'lucide-react';
import {
  formatExploreEventDateLabel,
  isPublishedActivityStatus,
  memberProfilePath,
  type ActivityDTO,
} from '@uaetrail/shared-types';
import { getActiveTenantId } from '../../api/tenant';
import { parseActivityTypeParam } from '../../config/activityTypes';
import {
  ActivityActionsMenu,
  ActivityListPreview,
  buildHostActivityMenuItems,
} from '../../components/activities';
import {
  activityTypeToHostComposeKind,
  navigateToExploreHost,
} from '@/discovery/discoveryPortExploreHosting';
import { ConsoleShell } from './ConsoleShell';
import { TenantSwitcher } from '../../components/ui';
import { ActivityMapPeekWireFooter } from '../../components/activity/ActivityMapPeekWireFooter';
import type { ActivityMapPeekActionHandlers } from '../../activity/executeActivityMapPeekAction';
import { useActivityInviteShareSheet } from '../../hooks/useActivityInviteShareSheet';
import { ActivityManageSheet } from '../../components/activity/ActivityManageSheet';
import { HostActivityManageCancelDialogs } from '../../components/activity/HostActivityManageCancelDialogs';
import { useHostActivityManageActions } from '../../hooks/useHostActivityManageActions';
import {
  useInvalidateOperatorWorkspace,
  useOperatorWorkspaceJoinQueue,
  useOperatorWorkspaceActivities,
} from '../../hooks/operatorWorkspaceQueries';
import { useAuth } from '../../context/AuthContext';
import { hostPublishAvailabilityNoticeMessage } from '../../plan/hostPublishAvailabilityNotice';
import { OPERATOR_ACTIVITIES_NEW_PATH, OPERATOR_ACTIVITIES_PATH } from '../../config/routingCatalog';
import {
  formatActivityCapacity,
  formatActivityPrice,
  resolveActivityHostLabel,
  resolveActivityTitle,
} from '../../utils/activityIdentity';
import { activityKindChromeEmoji } from '../../activity/activityKindChrome';
import { matchesActivitySearch } from '../../utils/activitySearch';
import { FloatingActionButton } from '../../components/mobile/FloatingActionButton';
import { LoadingRing } from '../../components/ui/loadingPrimitives';
import { consumerDetailChildLinkState } from '@/discovery/discoveryPortExploreRouting';
import { mobileBackNavState } from '../../utils/mobileBackNav';
import {
  AdminTablePager,
  DEFAULT_ADMIN_PAGE_SIZE,
  paginateRows,
  type AdminPageSize,
} from '../../components/admin/AdminTablePager';

type ActivitySortKey = 'title' | 'host' | 'date' | 'spots' | 'price' | 'status';
type SortDir = 'asc' | 'desc';

const compareText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

const activityDateTimeValue = (activity: ActivityDTO): number => {
  const date = activity.date?.trim() || '';
  const time = activity.time?.trim() || '00:00';
  const parsed = Date.parse(`${date}T${time}`);
  return Number.isFinite(parsed) ? parsed : Date.parse(date) || 0;
};

const bookedSpots = (activity: ActivityDTO): number =>
  Math.max(0, (activity.slotsTotal ?? 0) - (activity.slotsAvailable ?? 0));

/** Operator workspace: tenant-scoped activities (`GET /workspace/activities`). */
export const Activities = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<ActivitySortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const [previewActivity, setPreviewActivity] = useState<ActivityDTO | null>(null);
  const [previewPublishing, setPreviewPublishing] = useState(false);
  const [manageActivity, setManageActivity] = useState<ActivityDTO | null>(null);
  const [manageInitialView, setManageInitialView] = useState<'overview' | 'checkin'>('overview');
  const [publishNotice, setPublishNotice] = useState<string | null>(null);
  const { user } = useAuth();

  const activitiesQuery = useOperatorWorkspaceActivities(tenantId, Boolean(tenantId));
  const joinQueueQuery = useOperatorWorkspaceJoinQueue(tenantId, Boolean(tenantId));
  const invalidateWorkspace = useInvalidateOperatorWorkspace(tenantId);

  const events = useMemo(() => activitiesQuery.data ?? [], [activitiesQuery.data]);
  const pendingRequests = useMemo(
    () => (joinQueueQuery.data ?? []).filter((request) => request.status === 'pending'),
    [joinQueueQuery.data]
  );
  const loading =
    Boolean(tenantId) &&
    ((activitiesQuery.isLoading && !activitiesQuery.data) ||
      (joinQueueQuery.isLoading && !joinQueueQuery.data));
  const loadError =
    activitiesQuery.error instanceof Error
      ? activitiesQuery.error.message
      : joinQueueQuery.error instanceof Error
        ? joinQueueQuery.error.message
        : activitiesQuery.error || joinQueueQuery.error
          ? 'Failed to load events'
          : null;

  const reloadEvents = useCallback(async () => {
    invalidateWorkspace();
    await Promise.all([activitiesQuery.refetch(), joinQueueQuery.refetch()]);
  }, [activitiesQuery, invalidateWorkspace, joinQueueQuery]);

  const hostActions = useHostActivityManageActions(tenantId, reloadEvents);
  const inviteShare = useActivityInviteShareSheet();

  const openCreateActivity = () => {
    navigateToExploreHost(navigate);
  };

  useEffect(() => {
    if (location.pathname !== OPERATOR_ACTIVITIES_NEW_PATH) return;
    const type = parseActivityTypeParam(searchParams.get('type'));
    navigateToExploreHost(navigate, type ? activityTypeToHostComposeKind(type) : null);
  }, [location.pathname, navigate, searchParams]);

  const openManage = useCallback((activity: ActivityDTO, view: 'overview' | 'checkin' = 'overview') => {
    setManageInitialView(view);
    setManageActivity(activity);
  }, []);

  const mapPeekHandlersFor = useCallback(
    (activity: ActivityDTO): ActivityMapPeekActionHandlers => ({
      shareActivity: () =>
        inviteShare.openShareFromActivity(activity, { canSendFriendInvites: true }),
      manageActivity: () => openManage(activity, 'overview'),
      openCrewChat: () =>
        void hostActions.openGroupChat(activity.id, activity.groupChatId, {
          returnTo: OPERATOR_ACTIVITIES_PATH,
        }),
    }),
    [hostActions, inviteShare, openManage]
  );

  const openPreview = (event: ActivityDTO) => {
    if (isPublishedActivityStatus(event.status)) {
      hostActions.previewPublished(event.id);
      return;
    }
    setPreviewActivity(event);
  };

  const openActivityDetail = (event: ActivityDTO) => {
    navigate(`/activity/${event.id}`, {
      state: consumerDetailChildLinkState(OPERATOR_ACTIVITIES_PATH, 'Activities'),
    });
  };

  const applyPublishAvailabilityNotice = async (event: ActivityDTO) => {
    const notice = await hostPublishAvailabilityNoticeMessage(event, user?.id);
    if (notice) setPublishNotice(notice);
  };

  const publishActivityWithNotice = async (event: ActivityDTO) => {
    setPublishNotice(null);
    const published = await hostActions.publishActivity(event.id);
    if (published) {
      await applyPublishAvailabilityNotice(event);
    }
    return published;
  };

  const publishFromPreview = async (event: ActivityDTO) => {
    setPreviewPublishing(true);
    try {
      const published = await publishActivityWithNotice(event);
      if (published) setPreviewActivity(null);
    } finally {
      setPreviewPublishing(false);
    }
  };

  useEffect(() => {
    const rosterId = searchParams.get('roster') ?? searchParams.get('checkin');
    if (!rosterId || !tenantId || events.length === 0) return;

    const event = events.find((item) => item.id === rosterId);
    if (!event || event.status !== 'published') return;

    openManage(event, 'checkin');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('checkin');
    nextParams.delete('roster');
    setSearchParams(nextParams, { replace: true });
  }, [events, openManage, searchParams, setSearchParams, tenantId]);

  useEffect(() => {
    if (!manageActivity) return;
    const fresh = events.find((item) => item.id === manageActivity.id);
    if (fresh) setManageActivity(fresh);
  }, [events, manageActivity]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return events;
    return events.filter((event) =>
      matchesActivitySearch(
        q,
        resolveActivityTitle(event),
        event.locationName,
        event.activityType,
        resolveActivityHostLabel(event),
        ...(event.guides ?? []).map((guide) => guide.displayName)
      )
    );
  }, [events, searchQuery]);

  /** Sort the full filtered set first, then paginate — never sort only the current page. */
  const sortedEvents = useMemo(() => {
    const rows = [...filteredEvents];
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      let cmp: number;
      switch (sortKey) {
        case 'title':
          cmp = compareText(resolveActivityTitle(a), resolveActivityTitle(b));
          break;
        case 'host':
          cmp = compareText(resolveActivityHostLabel(a), resolveActivityHostLabel(b));
          break;
        case 'date':
          cmp = activityDateTimeValue(a) - activityDateTimeValue(b);
          break;
        case 'spots':
          cmp = bookedSpots(a) - bookedSpots(b) || (a.slotsTotal ?? 0) - (b.slotsTotal ?? 0);
          break;
        case 'price':
          cmp = (a.price ?? 0) - (b.price ?? 0);
          break;
        case 'status':
          cmp = compareText(a.status ?? '', b.status ?? '');
          break;
        default:
          cmp = 0;
      }
      if (cmp !== 0) return cmp * dir;
      return compareText(a.id, b.id) * dir;
    });
    return rows;
  }, [filteredEvents, sortDir, sortKey]);

  const pagedEvents = useMemo(
    () => paginateRows(sortedEvents, page, pageSize),
    [page, pageSize, sortedEvents]
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortKey, sortDir, pageSize, tenantId]);

  const toggleSort = (key: ActivitySortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  const sortHeader = (key: ActivitySortKey, label: string, align: 'left' | 'center' = 'left') => {
    const active = sortKey === key;
    const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
    return (
      <th
        className={`px-4 py-3 ${align === 'center' ? 'text-center' : 'text-left'}`}
        aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className={`inline-flex items-center gap-1 font-semibold ${
            align === 'center' ? 'justify-center' : ''
          } ${active ? 'text-emerald-800' : 'text-neutral-700 hover:text-emerald-800'}`}
        >
          {label}
          <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        </button>
      </th>
    );
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  const displayError = loadError ?? hostActions.error;

  return (
    <>
      <ConsoleShell title="Activities">
        <div className="space-y-4 pb-20">
          <TenantSwitcher onChange={setTenantId} />
          {displayError && <p className="text-sm text-red-600">{displayError}</p>}
          {publishNotice && <p className="text-sm text-emerald-700">{publishNotice}</p>}

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search activities, hosts, guides…"
              aria-label="Search activities"
              className="w-full rounded-xl border border-neutral-200/80 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 shadow-sm outline-none ring-emerald-600/30 placeholder:text-neutral-400 focus:ring-2"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8" role="status" aria-label="Loading">
              <LoadingRing size="md" />
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white desktop-scrollbar-x overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      {sortHeader('title', 'Activity')}
                      {sortHeader('host', 'Hosts & guides')}
                      {sortHeader('date', 'Date / time')}
                      {sortHeader('spots', 'Spots', 'center')}
                      {sortHeader('price', 'Price', 'center')}
                      {sortHeader('status', 'Status')}
                      <th className="px-4 py-3 text-left font-semibold text-neutral-700">Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedEvents.map((event) => {
                      const hostName = resolveActivityHostLabel(event);
                      const hostNameKey = hostName.trim().toLowerCase();
                      const extraGuides = (event.guides ?? []).filter((guide) => {
                        if (event.hostUserId && guide.userId === event.hostUserId) return false;
                        if (hostNameKey && guide.displayName.trim().toLowerCase() === hostNameKey) {
                          return false;
                        }
                        return true;
                      });
                      return (
                        <tr
                          key={event.id}
                          className="cursor-pointer border-t border-neutral-100"
                          onClick={() => openActivityDetail(event)}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-neutral-900">
                              <span className="mr-1.5" aria-hidden>
                                {activityKindChromeEmoji(event.activityType)}
                              </span>
                              {resolveActivityTitle(event)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div
                              className="flex flex-col gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              {(() => {
                                const hostPath = event.hostUserId
                                  ? memberProfilePath(event.hostUserId, { lens: 'host' })
                                  : null;
                                return hostPath ? (
                                  <Link
                                    to={hostPath}
                                    state={mobileBackNavState(OPERATOR_ACTIVITIES_PATH, 'Activities')}
                                    className="font-medium text-emerald-700 hover:underline"
                                  >
                                    {hostName}
                                  </Link>
                                ) : (
                                  <span className="text-neutral-800">{hostName}</span>
                                );
                              })()}
                              {extraGuides.map((guide) => {
                                const guidePath = memberProfilePath(guide.userId, { lens: 'host' });
                                if (!guidePath) return null;
                                return (
                                  <Link
                                    key={guide.userId}
                                    to={guidePath}
                                    state={mobileBackNavState(OPERATOR_ACTIVITIES_PATH, 'Activities')}
                                    className="text-xs text-emerald-700 hover:underline"
                                  >
                                    {guide.displayName}
                                  </Link>
                                );
                              })}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <p className="text-neutral-900">
                              {formatExploreEventDateLabel(event.date) ?? event.date}
                            </p>
                            {event.time ? <p className="text-xs text-neutral-500">{event.time}</p> : null}
                          </td>
                          <td className="px-4 py-3 text-center text-neutral-900">
                            {formatActivityCapacity(event)}
                          </td>
                          <td className="px-4 py-3 text-center">{formatActivityPrice(event)}</td>
                          <td className="px-4 py-3">{statusBadge(event.status)}</td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <ActivityMapPeekWireFooter
                                activity={event}
                                handlers={mapPeekHandlersFor(event)}
                                variant="console"
                              />
                              <ActivityActionsMenu
                                items={buildHostActivityMenuItems(event, {
                                  onPreview: openPreview,
                                  onManage: (e) => openManage(e, 'overview'),
                                  onPublish: (e) => void publishActivityWithNotice(e),
                                  onDuplicate: (e) => void hostActions.duplicateActivity(e),
                                  onHostFromExisting: hostActions.hostFromExistingActivity,
                                  onDelete: hostActions.setConfirmDelete,
                                  onCancel: hostActions.setConfirmCancel,
                                  onSuspend: hostActions.setConfirmSuspend,
                                  onResume: (e) => void hostActions.resumeActivity(e),
                                  onCheckin: (e) => openManage(e, 'checkin'),
                                })}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {sortedEvents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                          {searchQuery.trim()
                            ? 'No activities match your search.'
                            : 'No activities yet. Create your first activity!'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <AdminTablePager
                page={page}
                pageSize={pageSize}
                total={sortedEvents.length}
                onPage={setPage}
                onPageSize={setPageSize}
              />
            </>
          )}
        </div>

        <ActivityListPreview
          activity={previewActivity}
          saving={previewPublishing}
          onClose={() => setPreviewActivity(null)}
          onSaveDraft={() => setPreviewActivity(null)}
          onPublish={publishFromPreview}
        />

        <ActivityManageSheet
          open={Boolean(manageActivity)}
          activity={manageActivity}
          tenantId={tenantId}
          pendingRequests={pendingRequests}
          actions={hostActions}
          initialView={manageInitialView}
          onOpenPublicPage={(activity) => openActivityDetail(activity)}
          onClose={() => {
            setManageActivity(null);
            setManageInitialView('overview');
          }}
          onRequestsChanged={() => void reloadEvents()}
        />

        {!manageActivity ? <HostActivityManageCancelDialogs actions={hostActions} /> : null}
      </ConsoleShell>

      <FloatingActionButton
        icon={<Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />}
        label="Add activity"
        extended
        text="Add activity"
        disabled={!tenantId}
        onClick={openCreateActivity}
      />
    </>
  );
};
