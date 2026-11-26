import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useConsoleHubData } from '../../console/useHubData';
import { useHostActivityManageActions } from '../../hooks/useHostActivityManageActions';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../../components/mobile/ConsumerFeedback';
import { ActivityManageSheet } from '../../components/activity/ActivityManageSheet';
import { HostedActivityListRow } from '../../components/activity/HostedActivityListRow';
import {
  activityCrewPath,
  activityDetailPath,
  exploreHostPath,
  planHostedSchedulePath,
} from '../../config/routingCatalog';
import { matchesActivitySearch } from '../../utils/activitySearch';
import { resolveJoinRequestActivity } from '../../utils/joinRequestActivity';
import type { ActivityRequestView } from '../../api/types';
import { useActivityInviteShareSheet } from '../../hooks/useActivityInviteShareSheet';
import type { ActivityMapPeekActionHandlers } from '../../activity/executeActivityMapPeekAction';
import { profileHistoryEntityLinkState } from '@/discovery/discoveryPortExploreMapPeekNav';
import { viewReturnPathKey } from '../../utils/viewReturnMemory';

type ActivityTab = 'upcoming' | 'past';

const pendingCountForActivity = (activityId: string, requests: ActivityRequestView[]) =>
  requests.filter((request) => {
    if (request.status !== 'pending') return false;
    return resolveJoinRequestActivity(request)?.id === activityId;
  }).length;

/** Member’s hosted activities list — Activity entity with tenant manage projection (Plan / history). */
export const HostedActivitiesSection = ({
  refreshKey = 0,
  searchQuery = '',
  timeScope,
  layout = 'page',
  peekBridgeOnly = false,
}: {
  refreshKey?: number;
  searchQuery?: string;
  timeScope?: 'upcoming' | 'past';
  layout?: 'page' | 'embedded';
  /** Open manage sheet from `?peek=`. `?roster=` and `?checkin=` open the crew page. */
  peekBridgeOnly?: boolean;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const historyReturn = profileHistoryEntityLinkState(viewReturnPathKey(location.pathname, location.search));
  const host = useConsoleHubData();
  const hostActions = useHostActivityManageActions(host.tenantId, host.reload);
  const inviteShare = useActivityInviteShareSheet();
  const [activityTab, setActivityTab] = useState<ActivityTab>(timeScope ?? 'upcoming');
  const [manageActivity, setManageActivity] = useState<ActivityDTO | null>(null);

  const today = useMemo(() => new Date(new Date().toDateString()), []);

  /** Live outings only — drafts stay on Explore / operator console. */
  const hostedActivities = useMemo(
    () => host.activities.filter((event) => event.status !== 'draft'),
    [host.activities]
  );

  const upcomingActivities = useMemo(
    () =>
      hostedActivities
        .filter((event) => new Date(event.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [hostedActivities, today]
  );

  const pastActivities = useMemo(
    () =>
      hostedActivities
        .filter((event) => new Date(event.date) < today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [hostedActivities, today]
  );

  const lockedTab = timeScope ?? activityTab;
  const visibleActivities = lockedTab === 'upcoming' ? upcomingActivities : pastActivities;

  const filteredActivities = useMemo(
    () =>
      visibleActivities.filter((event) =>
        matchesActivitySearch(searchQuery, event.title, event.locationName)
      ),
    [searchQuery, visibleActivities]
  );

  useEffect(() => {
    if (!refreshKey) return;
    void host.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when refreshKey bumps; host.reload is stable
  }, [refreshKey, host.reload]);

  const openManage = (activity: ActivityDTO) => {
    setManageActivity(activity);
  };

  const returnTo = viewReturnPathKey(location.pathname, location.search);

  const mapPeekHandlersFor = useCallback(
    (activity: ActivityDTO): ActivityMapPeekActionHandlers => ({
      shareActivity: () =>
        inviteShare.openShareFromActivity(activity, { canSendFriendInvites: true }),
      manageActivity: () => openManage(activity),
      openCrewChat: () =>
        void hostActions.openGroupChat(activity.id, activity.groupChatId, { returnTo }),
    }),
    [hostActions, inviteShare, returnTo]
  );

  const openedDeepLinkRef = useRef<string | null>(null);

  useEffect(() => {
    const rosterId = searchParams.get('roster') ?? searchParams.get('checkin');
    const peekId = searchParams.get('peek');
    if (host.loading || !host.tenantId) return;

    if (rosterId) {
      const activity = hostedActivities.find((event) => event.id === rosterId);
      if (!activity || openedDeepLinkRef.current === rosterId) return;
      openedDeepLinkRef.current = rosterId;
      const next = new URLSearchParams(searchParams);
      next.delete('peek');
      next.delete('checkin');
      next.delete('roster');
      setSearchParams(next, { replace: true });
      navigate(activityCrewPath(rosterId));
      return;
    }

    if (!peekId || openedDeepLinkRef.current === peekId) return;
    const activity = hostedActivities.find((event) => event.id === peekId);
    if (!activity) return;
    openedDeepLinkRef.current = peekId;
    openManage(activity);
    const next = new URLSearchParams(searchParams);
    next.delete('peek');
    setSearchParams(next, { replace: true });
  }, [hostedActivities, host.loading, host.tenantId, navigate, searchParams, setSearchParams]);

  useEffect(() => {
    if (!manageActivity) return;
    const fresh = host.activities.find((a) => a.id === manageActivity.id);
    if (fresh) setManageActivity(fresh);
  }, [host.activities, manageActivity]);

  const peekId = searchParams.get('peek');
  const showList = !peekBridgeOnly;

  if (showList && host.loading) {
    return <ConsumerLoadingSpinner />;
  }

  if (peekBridgeOnly && !peekId && !manageActivity) {
    return null;
  }

  if (peekBridgeOnly && host.tenantId) {
    return (
      <>
        <ActivityManageSheet
          open={Boolean(manageActivity)}
          activity={manageActivity}
          tenantId={host.tenantId}
          actions={hostActions}
          pendingRequests={host.pendingRequests}
          onClose={() => {
            setManageActivity(null);
          }}
          onRequestsChanged={host.reload}
        />
      </>
    );
  }

  if (!host.tenantId) {
    if (peekBridgeOnly) return null;
    return (
      <ConsumerInlineEmpty
        message="Host profile is still loading — try again in a moment, or open your hosted plans."
        actionLabel="Hosted on Plan"
        actionTo={planHostedSchedulePath()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {(hostActions.error || host.error) && (
        <ConsumerErrorCard message={hostActions.error ?? host.error ?? ''} />
      )}

      {host.pendingRequests.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-neutral-800">
              Incoming requests ({host.pendingRequests.length})
            </h3>
            <Link to={planHostedSchedulePath()} className="text-xs font-semibold text-emerald-600">
              View all
            </Link>
          </div>
          <p className="px-1 text-xs text-neutral-500">
            Open an outing below to approve or decline requests for that plan.
          </p>
        </section>
      )}

      {timeScope || layout === 'embedded' ? null : (
        <div className="flex items-center justify-end">
          <AppSegmented
            segments={[
              { key: 'upcoming', label: `Upcoming (${upcomingActivities.length})` },
              { key: 'past', label: `Past (${pastActivities.length})` },
            ]}
            value={activityTab}
            onChange={setActivityTab}
          />
        </div>
      )}

      {visibleActivities.length === 0 ? (
        <ConsumerInlineEmpty
          message={
            lockedTab === 'upcoming' ? 'No upcoming hosted activities.' : 'No past hosted activities yet.'
          }
          actionLabel="Create activity"
          actionTo={exploreHostPath()}
        />
      ) : filteredActivities.length === 0 ? (
        <ConsumerInlineEmpty message="No hosted activities match your search." />
      ) : (
        <div className="space-y-2">
          {filteredActivities.map((activity) => (
            <HostedActivityListRow
              key={activity.id}
              activity={activity}
              layout="desktop-actions"
              pendingRequestCount={pendingCountForActivity(activity.id, host.pendingRequests)}
              onOpenDetail={() => openManage(activity)}
              mapPeekHandlers={mapPeekHandlersFor(activity)}
            />
          ))}
        </div>
      )}

      <ActivityManageSheet
        open={Boolean(manageActivity)}
        activity={manageActivity}
        tenantId={host.tenantId}
        actions={hostActions}
        pendingRequests={host.pendingRequests}
        onOpenPublicPage={(a) => navigate(activityDetailPath(a.id), { state: historyReturn })}
        onShare={(a) =>
          inviteShare.openShareFromActivity(a, { canSendFriendInvites: true })
        }
        onClose={() => {
          setManageActivity(null);
        }}
        onRequestsChanged={host.reload}
      />
    </div>
  );
};
