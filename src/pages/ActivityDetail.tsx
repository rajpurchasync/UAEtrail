import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import {
  type ActivityDetailDTO,
  type ActivityDTO,
  type ActivityParticipationDTO,
  type ActivityViewerAccessDTO,
  type MyActivityRequestDTO,
  type ReviewDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';
import { detailBackPath } from '../config/routingCatalog';
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
import { useHostStatus } from '../hooks/useHostStatus';
import { viewerIsActivityHostUser } from '../utils/viewerHostsActivity';
import { ExploreGuestSignInCard } from '../explore/ui/ExploreGuestSignInCard';
import { activityJoinInviteBanner } from '../content/exploreGoingPanelCopy';
import { HostActivityCancelDialog } from '../components/activity/HostActivityCancelDialog';
import { HostActivityCtas } from '../components/activity/HostActivityCtas';
import { hostActivityCancelParticipantNotice } from '../host/hostActivityCancelParticipantNotice';
import { hostActivityCtaHandlers as buildHostActivityCtaHandlers } from '../host/hostActivityCtaHandlers';
import { navigateToCreateLinkedRideshare } from '../explore/navigateCreateLinkedRideshare';
import { useActivityInviteShareSheet } from '../hooks/useActivityInviteShareSheet';
import { EXPLORE_MAP_PATH } from '../config/routingCatalog';

export const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const gate = useHostStatus({ enabled: Boolean(user) });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromJoinInvite = searchParams.get('invite') === '1';
  const joinInviteAutoOpenRef = useRef(false);
  const [activity, setActivity] = useState<ActivityDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [participation, setParticipation] = useState<ActivityParticipationDTO | null | undefined>(undefined);
  const [myRequest, setMyRequest] = useState<MyActivityRequestDTO | null | undefined>(undefined);
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);
  const [viewerAccess, setViewerAccess] = useState<ActivityViewerAccessDTO | null>(null);
  const [activityReviews, setActivityReviews] = useState<ReviewDTO[]>([]);
  const [hostRemoveConfirm, setHostRemoveConfirm] = useState<ActivityDTO | null>(null);
  const [hostRemoveBusy, setHostRemoveBusy] = useState(false);
  const inviteShare = useActivityInviteShareSheet();

  const loadActivity = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setParticipation(undefined);
    setMyRequest(undefined);
    setViewerAccess(null);
    api
      .getPublicActivityDetail(id)
      .then((res) => {
        setActivity(res.data);
        setViewerAccess(res.viewerAccess ?? null);
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

  useEffect(() => {
    if (!id || activity?.status !== 'published') {
      setActivityReviews([]);
      return;
    }
    void api.getActivityReviews(id).then((res) => setActivityReviews(res.data)).catch(() => setActivityReviews([]));
  }, [id, activity?.status]);

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
  const canWriteActivityReview = Boolean(participation?.checkedInAt);

  const detailExposure = useMemo(() => {
    if (!activity) return 'full' as const;
    return viewerAccess?.exposure ?? 'full';
  }, [activity, viewerAccess]);

  const isActivityHostUser = Boolean(
    activity &&
      user &&
      detailExposure !== 'none' &&
      viewerIsActivityHostUser(activity, user.id)
  );

  const hostActivityCtaHandlers = useMemo(() => {
    if (!isActivityHostUser || !activity) return null;
    return buildHostActivityCtaHandlers({
      activity,
      navigate,
      onInviteActivity: inviteShare.openInviteFromActivity,
      onCreateLinkedRideshare: (parent) => navigateToCreateLinkedRideshare(navigate, parent),
      onRequestDelete: setHostRemoveConfirm,
      onChatError: setError,
    });
  }, [isActivityHostUser, activity, navigate, inviteShare.openInviteFromActivity]);

  const hostRemoveParticipantNotice = useMemo(() => {
    if (!hostRemoveConfirm) return null;
    return hostActivityCancelParticipantNotice(hostRemoveConfirm, activity?.participants);
  }, [hostRemoveConfirm, activity?.participants]);

  const confirmHostRemove = useCallback(async () => {
    if (!hostRemoveConfirm || !gate.tenantId) return;
    setHostRemoveBusy(true);
    try {
      await api.cancelHostActivity(gate.tenantId, hostRemoveConfirm.id);
      setHostRemoveConfirm(null);
      navigate(EXPLORE_MAP_PATH);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update activity.');
    } finally {
      setHostRemoveBusy(false);
    }
  }, [hostRemoveConfirm, gate.tenantId, navigate]);

  const openJoinModal = () => {
    if (!id || !activity) return;
    if (!user) {
      const returnPath = fromJoinInvite ? `/activity/${id}?invite=1` : `/activity/${id}`;
      navigate(signInPathForReturn(returnPath));
      return;
    }
    if (!packageSelected) {
      setError('Please select a package option.');
      return;
    }
    setError(null);
    joinActions.openJoinModal();
  };

  useEffect(() => {
    if (!fromJoinInvite || loading || !activity || joinInviteAutoOpenRef.current) return;
    if (isActivityHostUser) return;
    if (activity.status !== 'published') return;
    if (!user) return;
    if (joinUiState.kind !== 'open') return;
    joinInviteAutoOpenRef.current = true;
    openJoinModal();
  }, [
    fromJoinInvite,
    loading,
    activity,
    user,
    joinUiState.kind,
    isActivityHostUser,
    openJoinModal,
  ]);

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

  if (detailExposure === 'none') {
    const guestPrivate = viewerAccess?.gateReason === 'sign_in' && !user;
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
            {guestPrivate ? (
              <div className="mt-6 text-left">
                <ExploreGuestSignInCard intent="peek-details" compact />
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </MobileDetailShell>
      </>
    );
  }

  const isRedactedPreview = detailExposure === 'redacted';

  const heroImage =
    activity.images?.[0] ??
    activity.location?.images?.[0] ??
    (activity.activityType === 'camping'
      ? 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600'
      : activity.activityType === 'event'
        ? 'https://images.unsplash.com/photo-1452626038306-9fff603b72e5?w=1600'
        : 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600');

  const confirmedSidebarExtras =
    isConfirmedParticipant && id ? (
      <div className="hidden md:block space-y-4">
        <ActivityChatCallout activityId={id} />
        <PushEnableBanner context="join" />
      </div>
    ) : null;

  return (
    <>
      <PageMeta
        title={activity.title || activity.locationName}
        description={
          activity.description?.slice(0, 160) ??
          `Join this ${activity.activityType} activity in the UAE on UAE Trail`
        }
        path={`/activity/${activity.id}`}
        image={heroImage}
        imageAlt={activity.title || activity.locationName}
        noIndex={isRedactedPreview}
      />
      <JsonLd data={activityEventSchema(activity)} id={`activity-${activity.id}`} />
      {(fromJoinInvite || activity.myJoinInvite) && !isConfirmedParticipant ? (
        <p
          className="mx-auto max-w-3xl px-4 pt-4 text-sm font-medium text-emerald-900 bg-emerald-50 border border-emerald-100 rounded-xl py-3"
          role="status"
        >
          {activityJoinInviteBanner(activity.myJoinInvite?.inviterDisplayName)}
        </p>
      ) : null}
      {isRedactedPreview && viewerAccess?.gateReason === 'sign_in' && !user ? (
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <ExploreGuestSignInCard intent="peek-details" compact />
        </div>
      ) : null}
      {isRedactedPreview && viewerAccess?.gateReason === 'join_required' && user ? (
        <p className="mx-auto max-w-3xl px-4 pt-4 text-sm font-medium text-neutral-700">
          Request to join or RSVP to unlock the full plan — meeting point, host notes, and crew chat.
        </p>
      ) : null}
      {isRedactedPreview && activity.message ? (
        <p className="mx-auto max-w-3xl px-4 pt-4 text-sm leading-relaxed text-neutral-600">
          {activity.message}
        </p>
      ) : null}
      <ActivityDetailView
        activity={activity}
        previewMode={isRedactedPreview}
        participation={isActivityHostUser ? null : participation ?? null}
        myRequest={isActivityHostUser ? null : myRequest ?? null}
        message={message}
        error={error}
        onJoin={isActivityHostUser ? undefined : openJoinModal}
        onWithdraw={isActivityHostUser ? undefined : () => joinActions.setShowWithdraw(true)}
        footerOverride={
          isActivityHostUser && hostActivityCtaHandlers ? (
            <HostActivityCtas
              activity={activity}
              linkRideshareTenantId={gate.tenantId}
              handlers={hostActivityCtaHandlers}
            />
          ) : undefined
        }
        sidebarJoinOverride={
          isActivityHostUser && hostActivityCtaHandlers ? (
            <div className="hidden md:block">
              <HostActivityCtas
                activity={activity}
                linkRideshareTenantId={gate.tenantId}
                handlers={hostActivityCtaHandlers}
              />
            </div>
          ) : undefined
        }
        confirmedSidebarExtras={isActivityHostUser ? null : confirmedSidebarExtras}
        selectedPackageIndex={selectedPackageIndex}
        onSelectedPackageIndexChange={setSelectedPackageIndex}
        joinDisabled={!packageSelected}
        canSendJoinInvites={isConfirmedParticipant}
        activityReviews={activityReviews}
        onActivityReviewSubmitted={(review) =>
          setActivityReviews((prev) => [review, ...prev.filter((row) => row.id !== review.id)])
        }
        canWriteActivityReview={canWriteActivityReview}
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
      {inviteShare.sheet}
      <HostActivityCancelDialog
        activity={hostRemoveConfirm}
        participantNotice={hostRemoveParticipantNotice}
        busy={hostRemoveBusy}
        onClose={() => setHostRemoveConfirm(null)}
        onConfirm={() => void confirmHostRemove()}
      />
    </>
  );
};

