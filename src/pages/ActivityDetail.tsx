import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import type {
  ActivityDetailDTO,
  ActivityParticipationDTO,
  MyActivityRequestDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';
import { detailBackPath } from '../utils/exploreRouting';
import { signInPathForReturn } from '../utils/authReturnContext';
import { useAuth } from '../context/AuthContext';
import { useActivityJoinActions } from '../hooks/useActivityJoinFlow';
import { useViewerProfileGender } from '../hooks/useViewerProfileGender';
import { womenOnlyJoinMessageForActivity } from '../utils/activityWomenOnlyJoin';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { activityEventSchema } from '../components/seo/schemas';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import { JoinRequestModal, WithdrawRequestModal } from '../components/ui';
import { ActivityChatCallout } from '../components/ui/ActivityChatCallout';
import { PushEnableBanner } from '../components/ui/PushEnableBanner';
import { ActivityDetailView } from '../components/activity/ActivityDetailView';
import { resolveJoinRequestUiState } from '../utils/joinRequestUi';
import { useOrganisationGate } from '../hooks/useOrganisationGate';
import { viewerHostsActivity } from '../utils/viewerHostsActivity';
import { tripsPath } from '../trips/tripsRouting';
export const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const gate = useOrganisationGate({ enabled: Boolean(user) });
  const navigate = useNavigate();
  const [activity, setActivity] = useState<ActivityDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [participation, setParticipation] = useState<ActivityParticipationDTO | null | undefined>(undefined);
  const [myRequest, setMyRequest] = useState<MyActivityRequestDTO | null | undefined>(undefined);
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);

  const loadActivity = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setParticipation(undefined);
    setMyRequest(undefined);
    api
      .getPublicActivityDetail(id)
      .then((res) => {
        setActivity(res.data);
        setParticipation(res.data.myParticipation ?? null);
        setMyRequest(res.data.myRequest ?? null);
      })
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : 'Couldn\'t load this activity — try again.')
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const joinUiState = resolveJoinRequestUiState({
    myRequest: myRequest ?? null,
    participation: participation ?? null,
  });

  const viewerGender = useViewerProfileGender(user?.id);
  const joinGuardMessage = useMemo(
    () => womenOnlyJoinMessageForActivity(activity?.requirements, viewerGender),
    [activity?.requirements, viewerGender]
  );

  const joinActions = useActivityJoinActions({
    activity,
    uiState: joinUiState,
    requestIdFallback: myRequest?.id ?? null,
    joinGuardMessage,
    onReload: loadActivity,
    onMessage: setMessage,
    onError: setError,
  });

  const pricePackages = useMemo(
    () => activity?.pricePackages?.filter((pkg) => pkg.label.trim()) ?? [],
    [activity?.pricePackages]
  );
  const hasMultiplePackages = pricePackages.length > 1;
  const packageSelected = !hasMultiplePackages || selectedPackageIndex >= 0;
  const isConfirmedParticipant = Boolean(participation) || joinUiState.kind === 'confirmed';

  const isViewerHost = Boolean(
    activity &&
      user &&
      activity.visibilityState !== 'private' &&
      viewerHostsActivity(activity, user.id, gate.tenantId, gate.canPublish)
  );

  useEffect(() => {
    if (!isViewerHost || !activity) return;
    const params = new URLSearchParams();
    params.set('role', 'hosted');
    params.set('peek', activity.id);
    navigate(`${tripsPath()}?${params.toString()}`, { replace: true });
  }, [isViewerHost, activity, navigate]);

  const openJoinModal = () => {
    if (!id || !activity) return;
    if (!user) {
      navigate(signInPathForReturn(`/activity/${id}`));
      return;
    }
    if (!packageSelected) {
      setError('Please select a package option.');
      return;
    }
    setError(null);
    joinActions.openJoinModal();
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Loading activity" path={id ? `/activity/${id}` : undefined} />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
        </div>
      </>
    );
  }

  if (!activity) {
    return (
      <>
        <PageMeta title="Activity not found" noIndex path={id ? `/activity/${id}` : undefined} />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center px-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">We couldn&apos;t find this activity</h1>
            <Link to={detailBackPath('activity')} className="text-emerald-600 hover:text-emerald-700 font-medium">
              View all activities
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (isViewerHost) {
    return (
      <>
        <PageMeta title="Loading" path={id ? `/activity/${id}` : undefined} />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
        </div>
      </>
    );
  }

  if (activity.visibilityState === 'private') {
    return (
      <>
        <PageMeta title="Private activity" noIndex path={id ? `/activity/${id}` : undefined} />
        <MobileDetailShell backTo={detailBackPath('activity')} backLabel="Explore">
          <div className="max-w-lg mx-auto px-4 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <Lock className="h-7 w-7 text-neutral-500" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-neutral-900">Private activity</h1>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              {activity.message ?? 'This activity is private — only invited members can view it.'}
            </p>
            <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
              If someone shared this link with you, sign in — or create a free account to request access.
            </p>
            {!user && (
              <Link
                to={signInPathForReturn(`/activity/${activity.id}`)}
                className="mt-4 inline-block text-sm font-semibold text-emerald-700"
              >
                Sign up or log in
              </Link>
            )}
          </div>
        </MobileDetailShell>
      </>
    );
  }

  const heroImage =
    activity.images?.[0] ??
    activity.location?.images?.[0] ??
    (activity.activityType === 'camping'
      ? 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600'
      : activity.activityType === 'event'
        ? 'https://images.unsplash.com/photo-1452626038306-9fff603b72e5?w=1600'
        : 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600');

  const confirmedFooterExtras =
    isConfirmedParticipant && id ? (
      <>
        <ActivityChatCallout activityId={id} />
        <PushEnableBanner context="join" />
      </>
    ) : null;

  const confirmedSidebarExtras =
    isConfirmedParticipant && id ? (
      <>
        <ActivityChatCallout activityId={id} className="mb-4" />
        <PushEnableBanner context="join" className="mb-4" />
      </>
    ) : null;

  return (
    <>
      <PageMeta
        title={activity.title || activity.locationName}
        description={
          activity.description?.slice(0, 160) ?? `Join this ${activity.activityType} activity in the UAE on UAE Trail`
        }
        path={`/activity/${activity.id}`}
        image={heroImage}
        imageAlt={activity.title || activity.locationName}
      />
      <JsonLd data={activityEventSchema(activity)} id={`activity-${activity.id}`} />
      <ActivityDetailView
        activity={activity}
        participation={participation ?? null}
        myRequest={myRequest ?? null}
        message={message}
        error={error}
        onJoin={openJoinModal}
        onWithdraw={() => joinActions.setShowWithdraw(true)}
        confirmedExtras={confirmedFooterExtras}
        confirmedSidebarExtras={confirmedSidebarExtras}
        selectedPackageIndex={selectedPackageIndex}
        onSelectedPackageIndexChange={setSelectedPackageIndex}
        joinDisabled={!packageSelected}
      />
      <WithdrawRequestModal
        open={joinActions.showWithdraw}
        onClose={() => joinActions.setShowWithdraw(false)}
        activityTitle={activity.title || activity.locationName}
        activityDate={activity.date}
        variant={joinActions.withdrawVariant}
        submitting={joinActions.withdrawing}
        onConfirm={joinActions.handleWithdraw}
      />
      <JoinRequestModal
        open={joinActions.joinModalOpen}
        onClose={joinActions.closeJoinModal}
        activity={activity}
        isFull={activity.slotsAvailable <= 0}
        selectedPackageIndex={hasMultiplePackages ? selectedPackageIndex : pricePackages.length === 1 ? 0 : undefined}
        onSuccess={joinActions.handleJoinSuccess}
      />
    </>
  );
};

