import { useCallback, useEffect, useState } from 'react';
import { useSafeAsyncEffect, type IsActiveGuard } from '../../hooks/useSafeAsyncEffect';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../../api/types';
import { getActivityJoinRequests } from '../../hooks/publishingJoinQueueClientApi';
import { listActivities } from '../../hooks/tenantActivityClientApi';
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
} from '../../explore/navigateExploreHost';
import { ConsoleShell } from '../../console/ConsoleShell';
import { TenantSwitcher } from '../../components/ui';
import { ActivityHubInviteIconButton } from '../../components/activity/ActivityHubInviteIconButton';
import { useActivityInviteShareSheet } from '../../hooks/useActivityInviteShareSheet';
import { ActivityManageSheet } from '../../components/activity/ActivityManageSheet';
import { useHostActivityManageActions } from '../../hooks/useHostActivityManageActions';
import { useAuth } from '../../context/AuthContext';
import { hostPublishAvailabilityNoticeMessage } from '../../plan/hostPublishAvailabilityNotice';
import { PUBLISHING_ACTIVITIES_NEW_PATH } from '../../config/routingCatalog';
import {
  activityTypeBadgeClass,
  formatActivityCapacity,
  formatActivityPrice,
  formatActivityType,
  resolveActivityHostLabel,
  resolveActivityLocationState,
  resolveActivityTitle,
} from '../../utils/activityIdentity';

/** Publishing workspace: tenant-scoped activities (`GET /publishing/activities`). */
export const Activities = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [events, setEvents] = useState<ActivityDTO[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ActivityRequestView[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewActivity, setPreviewActivity] = useState<ActivityDTO | null>(null);
  const [previewPublishing, setPreviewPublishing] = useState(false);
  const [manageActivity, setManageActivity] = useState<ActivityDTO | null>(null);
  const [manageInitialView, setManageInitialView] = useState<'overview' | 'checkin'>('overview');
  const [publishNotice, setPublishNotice] = useState<string | null>(null);
  const { user } = useAuth();

  const loadEvents = useCallback(async (tid: string, isActive: IsActiveGuard = () => true) => {
    if (!tid) return;
    try {
      const [activities, requests] = await Promise.all([
        listActivities(tid),
        getActivityJoinRequests(tid),
      ]);
      if (!isActive()) return;
      setEvents(activities);
      setPendingRequests(requests.filter((request) => request.status === 'pending'));
      setLoadError(null);
    } catch (err) {
      if (isActive()) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load events');
      }
    }
  }, []);

  const hostActions = useHostActivityManageActions(tenantId, () => loadEvents(tenantId));
  const inviteShare = useActivityInviteShareSheet();

  useSafeAsyncEffect(
    async (isActive) => {
      await loadEvents(tenantId, isActive);
    },
    [tenantId, loadEvents]
  );

  const openCreateActivity = () => {
    navigateToExploreHost(navigate);
  };

  useEffect(() => {
    if (location.pathname !== PUBLISHING_ACTIVITIES_NEW_PATH) return;
    const type = parseActivityTypeParam(searchParams.get('type'));
    navigateToExploreHost(navigate, type ? activityTypeToHostComposeKind(type) : null);
  }, [location.pathname, navigate, searchParams]);

  const openManage = (activity: ActivityDTO, view: 'overview' | 'checkin' = 'overview') => {
    setManageInitialView(view);
    setManageActivity(activity);
  };

  const openPreview = (event: ActivityDTO) => {
    if (event.status === 'published') {
      hostActions.previewPublished(event.id);
      return;
    }
    setPreviewActivity(event);
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
  }, [events, searchParams, setSearchParams, tenantId]);

  useEffect(() => {
    if (!manageActivity) return;
    const fresh = events.find((item) => item.id === manageActivity.id);
    if (fresh) setManageActivity(fresh);
  }, [events, manageActivity]);

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
    <ConsoleShell title="Activities">
      <div className="space-y-4">
        <TenantSwitcher onChange={setTenantId} />
        {displayError && <p className="text-sm text-red-600">{displayError}</p>}
        {publishNotice && <p className="text-sm text-emerald-700">{publishNotice}</p>}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
          <button
            onClick={openCreateActivity}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            disabled={!tenantId}
          >
            + Add Activity
          </button>
        </div>

        <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Host</th>
                <th className="px-4 py-3 text-left">Place</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-center">Capacity</th>
                <th className="px-4 py-3 text-center">Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{resolveActivityTitle(event)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${activityTypeBadgeClass(event.activityType)}`}
                    >
                      {formatActivityType(event.activityType)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{resolveActivityHostLabel(event)}</td>
                  <td className="px-4 py-3">{resolveActivityLocationState(event)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-gray-900">{event.date}</p>
                    <p className="text-xs text-gray-500">{event.time}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-900">{formatActivityCapacity(event)}</td>
                  <td className="px-4 py-3 text-center">{formatActivityPrice(event)}</td>
                  <td className="px-4 py-3">{statusBadge(event.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {event.status === 'published' && (
                        <ActivityHubInviteIconButton
                          onClick={() =>
                            inviteShare.openShareFromActivity(event, { canSendBuddyInvites: true })
                          }
                        />
                      )}
                      <ActivityActionsMenu
                        items={buildHostActivityMenuItems(event, {
                          onPreview: openPreview,
                          onManage: (e) => openManage(e, 'overview'),
                          onPublish: (e) => void publishActivityWithNotice(e),
                          onDuplicate: (e) => void hostActions.duplicateActivity(e),
                          onHostFromExisting: hostActions.hostFromExistingActivity,
                          onDelete: hostActions.setConfirmDelete,
                          onCancel: hostActions.setConfirmCancel,
                          onCheckin: (e) => openManage(e, 'checkin'),
                        })}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No activities yet. Create your first activity!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
        onClose={() => {
          setManageActivity(null);
          setManageInitialView('overview');
        }}
        onRequestsChanged={() => loadEvents(tenantId)}
      />
    </ConsoleShell>
  );
};
