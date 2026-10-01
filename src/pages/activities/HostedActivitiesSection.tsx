import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useOrganisationHubData } from '../../hooks/useOrganisationHubData';
import { useOrganisationActivityHostActions } from '../../hooks/useOrganisationActivityHostActions';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../../components/mobile/ConsumerFeedback';
import { HostActivityManageSheet } from '../../components/host/HostActivityManageSheet';
import { HostedActivityListRow } from '../../components/host/HostedActivityListRow';
import { buildTripsHostedActivityMenuItems } from '../../components/host/buildTripsHostedActivityMenu';
import { exploreOrganizePath } from '../../utils/exploreRouting';
import { matchesActivitySearch } from '../../utils/activitySearch';
import { resolveJoinRequestActivity } from '../../utils/joinRequestActivity';
import type { ActivityRequestView } from '../../api/index';
import { useActivityInviteShareSheet } from '../../hooks/useActivityInviteShareSheet';
import { useNavigate } from 'react-router-dom';

type ActivityTab = 'upcoming' | 'past';

const pendingCountForActivity = (activityId: string, requests: ActivityRequestView[]) =>
  requests.filter((request) => {
    if (request.status !== 'pending') return false;
    return resolveJoinRequestActivity(request)?.id === activityId;
  }).length;

/** Organisation-hosted activities list (Trips tab “Hosted”). */
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
  /** Open manage sheet from `?peek=` / `?checkin=` without rendering the list. */
  peekBridgeOnly?: boolean;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const host = useOrganisationHubData();
  const hostActions = useOrganisationActivityHostActions(host.tenantId, host.reload);
  const inviteShare = useActivityInviteShareSheet();
  const [activityTab, setActivityTab] = useState<ActivityTab>(timeScope ?? 'upcoming');
  const [manageActivity, setManageActivity] = useState<ActivityDTO | null>(null);
  const [manageInitialView, setManageInitialView] = useState<'overview' | 'checkin'>('overview');

  const today = useMemo(() => new Date(new Date().toDateString()), []);

  /** Trips shows live outings only — drafts are managed on Explore / host console. */
  const tripsHostedActivities = useMemo(
    () => host.activities.filter((event) => event.status !== 'draft'),
    [host.activities]
  );

  const upcomingActivities = useMemo(
    () =>
      tripsHostedActivities
        .filter((event) => new Date(event.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [tripsHostedActivities, today]
  );

  const pastActivities = useMemo(
    () =>
      tripsHostedActivities
        .filter((event) => new Date(event.date) < today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [tripsHostedActivities, today]
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
  }, [refreshKey, host.reload]);

  const openManage = (activity: ActivityDTO, view: 'overview' | 'checkin' = 'overview') => {
    setManageInitialView(view);
    setManageActivity(activity);
  };

  const hostedMenuHandlers = {
    onOpen: (activity: ActivityDTO) => {
      if (activity.status === 'published') {
        navigate(`/activity/${activity.id}`);
        return;
      }
      openManage(activity);
    },
    onShare: (activity: ActivityDTO) => inviteShare.openInviteFromActivity(activity),
    onEdit: hostActions.editActivity,
    onDuplicate: hostActions.reorganizeActivity,
    onCancel: hostActions.setConfirmCancel,
    onCheckin: (activity: ActivityDTO) => openManage(activity, 'checkin'),
  };

  const openedDeepLinkRef = useRef<string | null>(null);

  useEffect(() => {
    const openId = searchParams.get('peek') ?? searchParams.get('checkin');
    if (!openId || host.loading || !host.tenantId) return;
    if (openedDeepLinkRef.current === openId) return;
    const activity = tripsHostedActivities.find((event) => event.id === openId);
    if (!activity) return;
    openedDeepLinkRef.current = openId;
    openManage(activity, searchParams.get('checkin') ? 'checkin' : 'overview');
    const next = new URLSearchParams(searchParams);
    next.delete('peek');
    next.delete('checkin');
    setSearchParams(next, { replace: true });
  }, [tripsHostedActivities, host.loading, host.tenantId, searchParams, setSearchParams]);

  useEffect(() => {
    if (!manageActivity) return;
    const fresh = host.activities.find((a) => a.id === manageActivity.id);
    if (fresh) setManageActivity(fresh);
  }, [host.activities, manageActivity?.id]);

  const peekId = searchParams.get('peek') ?? searchParams.get('checkin');
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
        {inviteShare.sheet}
        <HostActivityManageSheet
          open={Boolean(manageActivity)}
          activity={manageActivity}
          tenantId={host.tenantId}
          pendingRequests={host.pendingRequests}
          actions={hostActions}
          initialView={manageInitialView}
          onOpenPublicPage={(a) => navigate(`/activity/${a.id}`)}
          onShare={(a) => inviteShare.openInviteFromActivity(a)}
          onClose={() => {
            setManageActivity(null);
            setManageInitialView('overview');
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
        message="Host profile is still loading — try again in a moment, or open the host console."
        actionLabel="Host console"
        actionTo="/host/overview"
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
            <Link to="/host/requests" className="text-xs font-semibold text-emerald-600">
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
          actionTo={exploreOrganizePath()}
        />
      ) : filteredActivities.length === 0 ? (
        <ConsumerInlineEmpty message="No hosted activities match your search." />
      ) : (
        <div className="space-y-2">
          {filteredActivities.map((activity) => (
            <HostedActivityListRow
              key={activity.id}
              activity={activity}
              pendingRequestCount={pendingCountForActivity(activity.id, host.pendingRequests)}
              menuItems={buildTripsHostedActivityMenuItems(activity, hostedMenuHandlers)}
              onOpenDetail={() => openManage(activity)}
            />
          ))}
        </div>
      )}

      {inviteShare.sheet}

      <HostActivityManageSheet
        open={Boolean(manageActivity)}
        activity={manageActivity}
        tenantId={host.tenantId}
        pendingRequests={host.pendingRequests}
        actions={hostActions}
        initialView={manageInitialView}
        onOpenPublicPage={(a) => navigate(`/activity/${a.id}`)}
        onShare={(a) => inviteShare.openInviteFromActivity(a)}
        onClose={() => {
          setManageActivity(null);
          setManageInitialView('overview');
        }}
        onRequestsChanged={host.reload}
      />
    </div>
  );
};
