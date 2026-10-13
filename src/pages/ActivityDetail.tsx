import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { type ActivityDTO, type ReviewDTO } from '@uaetrail/shared-types';
import { activityReviewsQueryKey } from '../hooks/clientQueryKeys';
import { useActivityReviews } from '../hooks/useActivityReviews';
import type { ActivityRequestView } from '../api/types';
import {
  cancelHostActivityById,
  fetchHostActivityJoinRequests,
} from '../hooks/hostActivityClientApi';
import { detailBackPath } from '../config/routingCatalog';
import { signInPathForReturn } from '../utils/authReturnContext';
import { useAuth } from '../context/AuthContext';
import { useActivityJoinActions } from '../hooks/useActivityJoinFlow';
import { activityDetailQueryKey } from '../hooks/clientQueryKeys';
import {
  type PublicActivityDetailPayload,
  usePublicActivityDetail,
} from '../hooks/usePublicActivityDetail';
import { useViewerProfileGender } from '../hooks/useViewerProfileGender';
import { womenOnlyJoinMessageForActivity } from '../utils/activityWomenOnlyJoin';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { activityEventSchema } from '../components/seo/schemas';
import { activityPublicMetaDescription } from '../utils/activityPublicSeo';
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
import {
  ACTIVITY_DETAIL_JOINED_QUERY,
  ACTIVITY_DETAIL_TAB_QUERY,
  parseActivityDetailTabParam,
  type ActivityDetailTabId,
} from '../activity/activityDetailTab';
import { resolveActivityDetailWirePresentation } from '../activity/resolveActivityDetailWirePresentation';
import { ActivityDetailJoinWelcomeSheet } from '../components/activity/detail/ActivityDetailJoinWelcomeSheet';
import { activityDetailPath } from '../config/routingCatalog';

export const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const gate = useHostStatus({ enabled: Boolean(user) });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fromJoinInvite = searchParams.get('invite') === '1';
  const joinInviteAutoOpenRef = useRef(false);
  const joinedWelcomeHandledRef = useRef(false);
  const {
    activity,
    loading,
    viewerAccess,
    wirePresentation,
    participation,
    myRequest,
    refetch: refetchActivityDetail,
  } = usePublicActivityDetail(id);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const reviewsEnabled = Boolean(id && activity?.status === 'published');
  const { reviews: activityReviews } = useActivityReviews(id, reviewsEnabled);
  const [hostRemoveConfirm, setHostRemoveConfirm] = useState<ActivityDTO | null>(null);
  const [hostRemoveBusy, setHostRemoveBusy] = useState(false);
  const [joinWelcomeOpen, setJoinWelcomeOpen] = useState(false);
  const [hostJoinRequests, setHostJoinRequests] = useState<ActivityRequestView[]>([]);
  const [hostJoinRequestsLoading, setHostJoinRequestsLoading] = useState(false);
  const inviteShare = useActivityInviteShareSheet();

  const loadActivity = useCallback(() => {
    void refetchActivityDetail();
  }, [refetchActivityDetail]);

  useEffect(() => {
    joinedWelcomeHandledRef.current = false;
  }, [id]);

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

  const isConfirmedParticipant = Boolean(participation) || joinUiState.kind === 'confirmed';

  const mobileTab = parseActivityDetailTabParam(searchParams.get(ACTIVITY_DETAIL_TAB_QUERY));
  const setMobileTab = useCallback(
    (tab: ActivityDetailTabId) => {
      const next = new URLSearchParams(searchParams);
      if (tab === 'plan') next.delete(ACTIVITY_DETAIL_TAB_QUERY);
      else next.set(ACTIVITY_DETAIL_TAB_QUERY, tab);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

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

  const loadHostJoinRequests = useCallback(() => {
    if (!id || !gate.tenantId || !isActivityHostUser) {
      setHostJoinRequests([]);
      return;
    }
    setHostJoinRequestsLoading(true);
    void fetchHostActivityJoinRequests(gate.tenantId, { activityId: id })
      .then((requests) => setHostJoinRequests(requests.filter((request) => request.status === 'pending')))
      .catch(() => setHostJoinRequests([]))
      .finally(() => setHostJoinRequestsLoading(false));
  }, [id, gate.tenantId, isActivityHostUser]);

  useEffect(() => {
    loadHostJoinRequests();
  }, [loadHostJoinRequests]);

  const effectiveWirePresentation = useMemo(() => {
    if (wirePresentation) return wirePresentation;
    if (!activity) return null;
    return resolveActivityDetailWirePresentation({
      activity,
      viewerAccess,
      isHostUser: isActivityHostUser,
      joinUiState,
      myParticipation: participation ?? null,
      myRequest: myRequest ?? null,
    });
  }, [
    wirePresentation,
    activity,
    viewerAccess,
    isActivityHostUser,
    joinUiState,
    participation,
    myRequest,
  ]);

  const presentation = useMemo(() => {
    if (!activity || !effectiveWirePresentation?.engagement) return null;
    const { joinEngagement: _joinEngagement, ...engagement } = effectiveWirePresentation.engagement;
    return engagement;
  }, [activity, effectiveWirePresentation]);

  const joinedWelcomeQuery = searchParams.get(ACTIVITY_DETAIL_JOINED_QUERY) === '1';

  useEffect(() => {
    if (!joinedWelcomeQuery || loading || !activity || joinedWelcomeHandledRef.current) return;
    if (!isConfirmedParticipant) return;
    if (presentation && !presentation.canAccessCrewSurfaces) return;
    joinedWelcomeHandledRef.current = true;
    setJoinWelcomeOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete(ACTIVITY_DETAIL_JOINED_QUERY);
    setSearchParams(next, { replace: true });
  }, [
    joinedWelcomeQuery,
    loading,
    activity,
    isConfirmedParticipant,
    presentation,
    searchParams,
    setSearchParams,
  ]);

  const handleJoinSuccess = useCallback(
    (successMessage: string) => {
      joinActions.handleJoinSuccess(successMessage);
      if (presentation?.showCrewWelcomeAfterInstantJoin) {
        setJoinWelcomeOpen(true);
      }
    },
    [joinActions, presentation]
  );

  const canAddLinkedRide = viewerAccess?.entitlements?.canAddLinkedRide ?? false;

  const hostActivityCtaHandlers = useMemo(() => {
    if (!isActivityHostUser || !activity) return null;
    return buildHostActivityCtaHandlers({
      activity,
      navigate,
      onInviteActivity: inviteShare.openInviteFromActivity,
      onCreateLinkedRideshare: (parent) => navigateToCreateLinkedRideshare(navigate, parent),
      onRequestDelete: setHostRemoveConfirm,
      onChatError: setError,
      onViewParticipants: () => setMobileTab('buddies'),
    });
  }, [isActivityHostUser, activity, navigate, inviteShare.openInviteFromActivity, setMobileTab]);

  const onHostShareOuting = useCallback(() => {
    if (!activity || activity.status !== 'published') return;
    inviteShare.openInviteFromActivity(activity, { canSendBuddyInvites: true });
  }, [activity, inviteShare.openInviteFromActivity]);

  const hostDetailCtas =
    isActivityHostUser && hostActivityCtaHandlers && activity ? (
      <HostActivityCtas
        activity={activity}
        linkRideshareTenantId={gate.tenantId}
        canAddLinkedRide={canAddLinkedRide}
        handlers={hostActivityCtaHandlers}
      />
    ) : null;

  const hostRemoveParticipantNotice = useMemo(() => {
    if (!hostRemoveConfirm) return null;
    return hostActivityCancelParticipantNotice(hostRemoveConfirm, activity?.participants);
  }, [hostRemoveConfirm, activity?.participants]);

  const confirmHostRemove = useCallback(async () => {
    if (!hostRemoveConfirm || !gate.tenantId) return;
    setHostRemoveBusy(true);
    try {
      await cancelHostActivityById(gate.tenantId, hostRemoveConfirm.id);
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
          isRedactedPreview || !presentation?.canAccessCrewSurfaces
            ? activityPublicMetaDescription(activity)
            : activity.description?.slice(0, 160) ?? activityPublicMetaDescription(activity)
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
          RSVP or request a spot to unlock meeting details and the group chat.
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
        hostDetailCtas={hostDetailCtas}
        sidebarJoinOverride={
          hostDetailCtas ? <div className="hidden md:block">{hostDetailCtas}</div> : undefined
        }
        confirmedSidebarExtras={isActivityHostUser ? null : confirmedSidebarExtras}
        canSendJoinInvites={isConfirmedParticipant}
        activityReviews={activityReviews}
        onActivityReviewSubmitted={(review) => {
          if (!id) return;
          queryClient.setQueryData<ReviewDTO[]>(activityReviewsQueryKey(id), (prev) => [
            review,
            ...(prev ?? []).filter((row) => row.id !== review.id),
          ]);
        }}
        canWriteActivityReview={canWriteActivityReview}
        mobileTab={mobileTab}
        onMobileTabChange={isRedactedPreview ? undefined : setMobileTab}
        canAccessCrewSurfaces={presentation?.canAccessCrewSurfaces ?? false}
        showParticipantFooterShortcuts={presentation?.showParticipantFooterShortcuts ?? false}
        showCrewLockedHint={presentation?.showCrewLockedHint ?? false}
        viewerEntitlements={viewerAccess?.entitlements ?? null}
        hostCrewChatPolicy={
          isActivityHostUser && gate.tenantId
            ? {
                tenantId: gate.tenantId,
                onSaved: (policy) => {
                  if (!id) return;
                  queryClient.setQueryData<PublicActivityDetailPayload>(
                    activityDetailQueryKey(id),
                    (prev) =>
                      prev
                        ? {
                            ...prev,
                            activity: { ...prev.activity, groupChatPostPolicy: policy },
                          }
                        : prev
                  );
                },
                onError: setError,
              }
            : undefined
        }
        hostBuddiesHub={
          isActivityHostUser && gate.tenantId && !isRedactedPreview
            ? {
                joinRequests: hostJoinRequests,
                requestsLoading: hostJoinRequestsLoading,
                onRequestsChanged: loadHostJoinRequests,
              }
            : undefined
        }
        wireFooterByTab={effectiveWirePresentation?.footerByTab ?? null}
        wireTabs={effectiveWirePresentation?.tabs ?? null}
        wireStrips={effectiveWirePresentation?.strips ?? null}
        onHostShareOuting={isActivityHostUser ? onHostShareOuting : undefined}
      />
      {activity && id ? (
        <ActivityDetailJoinWelcomeSheet
          open={joinWelcomeOpen}
          activityId={activity.id}
          detailPath={activityDetailPath(activity.id)}
          onClose={() => setJoinWelcomeOpen(false)}
          onOpenPlaceTab={() => setMobileTab('place')}
        />
      ) : null}
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
        onSuccess={handleJoinSuccess}
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

