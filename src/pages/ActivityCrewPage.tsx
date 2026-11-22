import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { activityCrewPath, activityDetailPath } from '../config/routingCatalog';
import { MobileBackButton } from '../components/mobile/MobileBackButton';
import { MobileDetailScrollShell } from '../components/mobile/MobileDetailScrollShell';
import { DetailPageLoadingState } from '../components/ui/DetailPageLoadingState';
import { SecureAvatar } from '../components/ui';
import { PageMeta } from '../components/seo/PageMeta';
import { ActivityDetailHostCrewHub } from '../components/activity/detail/ActivityDetailHostCrewHub';
import { DETAIL_LOADING_ACTIVITY } from '../content/detailLoadingCopy';
import { ACTIVITY_PARTICIPANTS_SECTION_LABEL } from '../content/activityParticipantsCopy';
import { activityDetailParticipantCountLabel } from '../components/activity/detail/activityDetailParticipantCountLabel';
import { resolveActivityDetailHeaderChrome } from '../activity/activityDetailHeaderChrome';
import { useAuth } from '../context/AuthContext';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { usePublicActivityDetail } from '../hooks/usePublicActivityDetail';
import { useActivityHostJoinRequests } from '../hooks/useActivityHostJoinRequests';
import { signInPath } from '../config/surfacePaths';
import { viewerIsActivityHostUser } from '../utils/viewerHostsActivity';

/**
 * Outing roster (`/activity/:id/crew`).
 * Hosts get status and actions. Everyone else entitled to the crew sees names.
 * The outing page only links here.
 */
export const ActivityCrewPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const gate = useMemberStatus({ enabled: Boolean(user) });
  const { activity, viewerAccess, loading } = usePublicActivityDetail(id);
  const [actionError, setActionError] = useState<string | null>(null);

  const isHost = Boolean(
    activity && user && viewerIsActivityHostUser(activity, user.id) && viewerAccess?.exposure !== 'none'
  );
  const canViewCrew = isHost || viewerAccess?.canAccessCrewSurfaces === true;

  const {
    joinRequests,
    loading: requestsLoading,
    refetch: refetchJoinRequests,
  } = useActivityHostJoinRequests({
    tenantId: gate.tenantId,
    activityId: id,
    enabled: isHost && Boolean(gate.tenantId),
  });

  if (!id) {
    return null;
  }

  if (!user) {
    return <Navigate to={signInPath({ redirect: activityCrewPath(id) })} replace />;
  }

  if (loading || (isHost && gate.loading)) {
    return (
      <>
        <PageMeta title="Loading participants" path={activityCrewPath(id)} />
        <DetailPageLoadingState label={DETAIL_LOADING_ACTIVITY} variant="page" />
      </>
    );
  }

  if (!activity) {
    return (
      <>
        <PageMeta title="Activity not found" noIndex path={activityCrewPath(id)} />
        <div className="app-page-center bg-gray-50">
          <div className="px-4 text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">We couldn&apos;t find this activity</h1>
            <div className="flex justify-center">
              <MobileBackButton fallbackTo={activityDetailPath(id)} label="Outing" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!canViewCrew || viewerAccess?.exposure === 'none') {
    return <Navigate to={activityDetailPath(activity.id)} replace />;
  }

  const headerChrome = resolveActivityDetailHeaderChrome(activity, null);
  const countLabel = activityDetailParticipantCountLabel(activity);
  const participants = activity.participants ?? [];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <PageMeta
        title={`${ACTIVITY_PARTICIPANTS_SECTION_LABEL} · ${activity.title || 'Outing'}`}
        noIndex
        path={activityCrewPath(activity.id)}
      />
      <MobileDetailScrollShell
        backTo={activityDetailPath(activity.id)}
        backLabel="Outing"
        headerChrome={headerChrome}
      >
        <div className="mx-auto w-full max-w-2xl px-4 py-4">
          {actionError ? (
            <p className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {actionError}
            </p>
          ) : null}
          {isHost && gate.tenantId ? (
            <ActivityDetailHostCrewHub
              tenantId={gate.tenantId}
              activityId={activity.id}
              activityTitle={activity.title || activity.locationName}
              activityType={activity.activityType}
              rideshareHasPayment={Boolean(activity.ridesharePriceAed)}
              joinRequests={joinRequests}
              requestsLoading={requestsLoading}
              onRequestsChanged={() => {
                void refetchJoinRequests();
              }}
              onError={setActionError}
            />
          ) : isHost ? (
            <p className="text-sm text-neutral-600">Host profile is still loading. Open this list again in a moment.</p>
          ) : (
            <section aria-label={ACTIVITY_PARTICIPANTS_SECTION_LABEL}>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Going</p>
              <h1 className="mt-0.5 text-lg font-semibold text-neutral-900">
                {activity.title || 'Outing'}
                {countLabel ? <span className="ml-2 text-sm font-medium text-neutral-500">{countLabel}</span> : null}
              </h1>
              {participants.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">No one confirmed yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
                  {participants.map((row) => (
                    <li key={row.id} className="flex items-center gap-3 px-3 py-3">
                      <SecureAvatar
                        src={row.avatar ?? undefined}
                        name={row.name ?? 'Member'}
                        className="h-9 w-9 shrink-0 text-sm"
                      />
                      <span className="min-w-0 truncate text-sm font-medium text-neutral-900">
                        {row.name ?? 'Member'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-sm text-neutral-500">
                <Link to={activityDetailPath(activity.id)} className="font-semibold text-emerald-700">
                  Back to the outing
                </Link>
              </p>
            </section>
          )}
        </div>
      </MobileDetailScrollShell>
    </div>
  );
};
