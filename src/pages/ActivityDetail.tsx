import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAsyncEffect, type IsActiveGuard } from '../hooks/useSafeAsyncEffect';
import { useParams, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { type ActivityDTO, type ReviewDTO } from '@uaetrail/shared-types';
import { activityReviewsQueryKey } from '../hooks/clientQueryKeys';
import { useActivityReviews } from '../hooks/useActivityReviews';
import type { ActivityRequestView } from '../api/types';
import { getActivityJoinRequests } from '../hooks/tenantActivityClientApi';
import { detailBackPath } from '../config/routingCatalog';
import {
  ACTIVITY_JOIN_CTA_SELECTOR,
  AUTH_RESUME_JOIN_QUERY,
  navigateToAuthGate,
  signInPathForReturn,
  withAuthResumeQuery,
} from '../utils/authReturnContext';
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
import { resolveActivityHeroImage } from '../utils/activityHeroImage';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import { JoinRequestModal, WithdrawRequestModal } from '../components/ui';
import { ActivityChatCallout } from '../components/ui/ActivityChatCallout';
import { PushEnableBanner } from '../components/ui/PushEnableBanner';
import { ActivityDetailByKind } from '../activity/detail/templates/ActivityDetailByKind';
import { resolveActivityDetailMobileTab } from '../activity/detail/buildActivityDetailPageModel';
import {
  scrollActivityDetailConsumerSection,
  scrollActivityDetailMeetingPoint,
} from '../activity/detail/activityDetailConsumerAnchors';
import { resolveJoinRequestUiState } from '../utils/joinRequestUi';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { viewerIsActivityHostUser } from '../utils/viewerHostsActivity';
import { activityJoinInviteBanner } from '../content/exploreGoingPanelCopy';
import { useHostActivitySheetBundle } from '../hooks/useHostActivitySheetBundle';
import { navigateToCreateLinkedRideshare } from '../explore/navigateCreateLinkedRideshare';
import { useActivityInviteShareSheet } from '../hooks/useActivityInviteShareSheet';
import {
  ACTIVITY_DETAIL_JOINED_QUERY,
  ACTIVITY_DETAIL_TAB_QUERY,
  type ActivityDetailTabId,
} from '../activity/activityDetailTab';
import {
  mergeActivityDetailWirePresentation,
  resolveActivityDetailWirePresentation,
} from '../activity/resolveActivityDetailWirePresentation';
import { ActivityDetailJoinWelcomeSheet } from '../components/activity/detail/ActivityDetailJoinWelcomeSheet';
import { ActivityDetailGuestGate } from '../components/activity/detail/ActivityDetailGuestGate';
import { activityDetailPath } from '../config/routingCatalog';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';

/**
 * Activity detail **route loader** (`/activity/:id`): fetch, join modals, SEO, host sheets.
 * **L3 kind layout:** `ActivityDetailByKind` → `*ActivityDetailPage` → `ActivityDetailPageShell`
 * (mirrors `HikingPlaceDetailPage` → `PlaceDetailPage` → `PlaceDetailPageShell`).
 */
export const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const gate = useMemberStatus({ enabled: Boolean(user) });
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const fromJoinInvite = searchParams.get('invite') === '1';
  const resumeJoinAfterAuth = searchParams.get(AUTH_RESUME_JOIN_QUERY) === '1';
  const joinInviteAutoOpenRef = useRef(false);
  const resumeJoinHandledRef = useRef(false);
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
  const [joinWelcomeOpen, setJoinWelcomeOpen] = useState(false);
  const [hostJoinRequests, setHostJoinRequests] = useState<ActivityRequestView[]>([]);
  const [hostJoinRequestsLoading, setHostJoinRequestsLoading] = useState(false);
  const inviteShare = useActivityInviteShareSheet();

  const loadActivity = useCallback(() => {
    void refetchActivityDetail();
  }, [refetchActivityDetail]);

  const hostSheets = useHostActivitySheetBundle({
    tenantId: gate.tenantId,
    onMapDataChanged: loadActivity,
  });

  useEffect(() => {
    joinedWelcomeHandledRef.current = false;
    resumeJoinHandledRef.current = false;
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

  /** Public scroll layout — legacy `?tab=` deep links scroll to anchors (embed/manage still use tab state). */
  const onConsumerSectionNav = useCallback((tab: ActivityDetailTabId) => {
    scrollActivityDetailConsumerSection(tab);
  }, []);

  useEffect(() => {
    if (!activity) return;
    const tabParam = searchParams.get(ACTIVITY_DETAIL_TAB_QUERY);
    if (!tabParam) return;
    const tab = resolveActivityDetailMobileTab(activity, { tabParam });
    scrollActivityDetailConsumerSection(tab);
    const next = new URLSearchParams(searchParams);
    next.delete(ACTIVITY_DETAIL_TAB_QUERY);
    setSearchParams(next, { replace: true });
  }, [activity, searchParams, setSearchParams]);

  const canWriteActivityReview = Boolean(participation?.checkedInAt);

  const detailExposure = useMemo(() => {
    if (!activity) return 'full' as const;
    return viewerAccess?.exposure ?? 'redacted';
  }, [activity, viewerAccess]);

  const isActivityHostUser = Boolean(
    activity &&
      user &&
      detailExposure !== 'none' &&
      viewerIsActivityHostUser(activity, user.id)
  );

  const loadHostJoinRequests = useCallback(
    async (isActive: IsActiveGuard = () => true) => {
      if (!id || !gate.tenantId || !isActivityHostUser) {
        if (isActive()) {
          setHostJoinRequests([]);
        }
        return;
      }
      if (isActive()) {
        setHostJoinRequestsLoading(true);
      }
      try {
        const requests = await getActivityJoinRequests(gate.tenantId, { activityId: id });
        if (isActive()) {
          setHostJoinRequests(requests.filter((request) => request.status === 'pending'));
        }
      } catch {
        if (isActive()) {
          setHostJoinRequests([]);
        }
      } finally {
        if (isActive()) {
          setHostJoinRequestsLoading(false);
        }
      }
    },
    [id, gate.tenantId, isActivityHostUser]
  );

  useSafeAsyncEffect(
    async (isActive) => {
      await loadHostJoinRequests(isActive);
    },
    [loadHostJoinRequests]
  );

  const resolvedWirePresentation = useMemo(() => {
    if (!activity || !viewerAccess) return null;
    return resolveActivityDetailWirePresentation({
      activity,
      viewerAccess,
      isHostUser: isActivityHostUser,
      joinUiState,
      myParticipation: participation ?? null,
      myRequest: myRequest ?? null,
    });
  }, [
    activity,
    viewerAccess,
    isActivityHostUser,
    joinUiState,
    participation,
    myRequest,
  ]);

  const effectiveWirePresentation = useMemo(
    () => mergeActivityDetailWirePresentation(wirePresentation, resolvedWirePresentation),
    [wirePresentation, resolvedWirePresentation]
  );

  const wireEngagement = effectiveWirePresentation?.engagement ?? null;

  const presentation = useMemo(() => {
    if (!wireEngagement) return null;
    const { joinEngagement: _joinEngagement, ...engagement } = wireEngagement;
    return engagement;
  }, [wireEngagement]);

  const requiresSignIn = viewerAccess?.gateReason === 'sign_in' && !user;
  const showJoinRequiredHint =
    Boolean(user) &&
    viewerAccess?.gateReason === 'join_required' &&
    !(wireEngagement?.canAccessCrewSurfaces ?? viewerAccess?.canAccessCrewSurfaces);

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
  const canOfferTransport = viewerAccess?.entitlements?.canOfferTransport ?? false;
  const canOpenLinkedRideshareFlow = canAddLinkedRide || canOfferTransport;

  const onHostShareOuting = useCallback(() => {
    if (!activity || activity.status !== 'published') return;
    inviteShare.openInviteFromActivity(activity, { canSendBuddyInvites: true });
  }, [activity, inviteShare]);

  const onParticipantInviteFriends = useCallback(() => {
    if (!activity || activity.status !== 'published') return;
    inviteShare.openInviteFromActivity(activity, { canSendBuddyInvites: true });
  }, [activity, inviteShare]);

  const canInviteFriendsToActivity =
    isConfirmedParticipant || joinUiState.kind === 'pending';

  const openJoinModal = useCallback(() => {
    if (!id || !activity) return;
    if (!user) {
      const basePath = fromJoinInvite ? `/activity/${id}?invite=1` : `/activity/${id}`;
      const returnPath = withAuthResumeQuery(basePath, { join: true });
      navigateToAuthGate(navigate, location, {
        returnPath,
        focusSelector: ACTIVITY_JOIN_CTA_SELECTOR,
      });
      return;
    }
    setError(null);
    joinActions.openJoinModal();
  }, [id, activity, user, fromJoinInvite, navigate, location, joinActions]);

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

  useEffect(() => {
    if (!resumeJoinAfterAuth || loading || !activity || resumeJoinHandledRef.current) return;
    if (isActivityHostUser) return;
    if (activity.status !== 'published') return;
    if (!user) return;
    if (joinUiState.kind !== 'open') return;
    resumeJoinHandledRef.current = true;
    setError(null);
    joinActions.openJoinModal();
  }, [
    resumeJoinAfterAuth,
    loading,
    activity,
    user,
    joinUiState.kind,
    isActivityHostUser,
    joinActions,
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

  const inviteOnlyLock =
    detailExposure === 'none' &&
    (viewerAccess?.gateReason === 'invite_only' || viewerAccess?.level === 'denied');

  if (inviteOnlyLock) {
    return (
      <>
        <PageMeta title="Private activity" noIndex path={id ? `/activity/${id}` : undefined} />
        <MobileDetailShell backTo={detailBackPath('activity')} backLabel="">
          <div className="max-w-lg mx-auto px-4 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <Lock className="h-7 w-7 text-neutral-500" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-neutral-900">Private activity</h1>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              {activity.message ?? 'This activity is private — only invited members can view it.'}
            </p>
            <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
              This plan is not listed on Explore. Only the host and people they invited can open it.
            </p>
            {!user ? (
              <Link
                to={signInPathForReturn(`/activity/${activity.id}`)}
                className="mt-4 inline-block text-sm font-semibold text-emerald-700"
              >
                Sign in if you were invited
              </Link>
            ) : null}
          </div>
        </MobileDetailShell>
      </>
    );
  }

  if (!user) {
    const pageTitle = activity.title || activity.locationName || 'Activity';
    return (
      <>
        <PageMeta title={pageTitle} noIndex path={id ? `/activity/${id}` : undefined} />
        <MobileDetailShell backTo={detailBackPath('activity')} backLabel="">
          <div className="max-w-lg mx-auto px-4 pt-4 pb-10">
            <ActivityDetailGuestGate activity={activity as ActivityDetailDTO} />
          </div>
        </MobileDetailShell>
      </>
    );
  }

  const isRedactedPreview = detailExposure === 'redacted';

  const heroImage = resolveActivityHeroImage({
    id: activity.id,
    activityType: activity.activityType,
    images: activity.images,
    bannerUrl: activity.bannerUrl,
    location: activity.location,
  });

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
        ogType="article"
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
      <ActivityDetailByKind
        activity={activity}
        requiresSignIn={requiresSignIn}
        showJoinRequiredHint={showJoinRequiredHint}
        participation={isActivityHostUser ? null : participation ?? null}
        myRequest={isActivityHostUser ? null : myRequest ?? null}
        message={message}
        error={error}
        onJoin={isActivityHostUser ? undefined : openJoinModal}
        onWithdraw={isActivityHostUser ? undefined : () => joinActions.setShowWithdraw(true)}
        confirmedSidebarExtras={isActivityHostUser ? null : confirmedSidebarExtras}
        canSendJoinInvites={canInviteFriendsToActivity}
        onParticipantInviteFriends={onParticipantInviteFriends}
        activityReviews={activityReviews}
        onActivityReviewSubmitted={(review) => {
          if (!id) return;
          queryClient.setQueryData<ReviewDTO[]>(activityReviewsQueryKey(id), (prev) => [
            review,
            ...(prev ?? []).filter((row) => row.id !== review.id),
          ]);
        }}
        canWriteActivityReview={canWriteActivityReview}
        onMobileTabChange={onConsumerSectionNav}
        canAccessCrewSurfaces={
          wireEngagement?.canAccessCrewSurfaces ?? viewerAccess?.canAccessCrewSurfaces ?? false
        }
        showParticipantFooterShortcuts={wireEngagement?.showParticipantFooterShortcuts ?? false}
        showCrewLockedHint={wireEngagement?.showCrewLockedHint ?? false}
        linkRideshareTenantId={gate.tenantId}
        onMapPeekChatError={setError}
        viewerEntitlements={viewerAccess?.entitlements ?? null}
        hostCrewChatPolicy={
          isActivityHostUser && gate.tenantId
            ? {
                tenantId: gate.tenantId,
                onSaved: (policy) => {
                  if (!id) return;
                  queryClient.setQueryData<PublicActivityDetailPayload>(
                    activityDetailQueryKey(id, user.id),
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
          isActivityHostUser && gate.tenantId
            ? {
                joinRequests: hostJoinRequests,
                requestsLoading: hostJoinRequestsLoading,
                onRequestsChanged: loadHostJoinRequests,
              }
            : undefined
        }
        consumerLayout={effectiveWirePresentation?.consumerLayout ?? null}
        wireStrips={effectiveWirePresentation?.strips ?? null}
        onHostShareOuting={isActivityHostUser ? onHostShareOuting : undefined}
        onOpenHostManage={isActivityHostUser ? hostSheets.openHostManage : undefined}
        viewerAccess={viewerAccess}
        onOfferLinkedRideshare={
          canOpenLinkedRideshareFlow && activity
            ? () => navigateToCreateLinkedRideshare(navigate, activity)
            : undefined
        }
      />
      {activity && id ? (
        <ActivityDetailJoinWelcomeSheet
          open={joinWelcomeOpen}
          activityId={activity.id}
          detailPath={activityDetailPath(activity.id)}
          onClose={() => setJoinWelcomeOpen(false)}
          onScrollToMeetingPoint={scrollActivityDetailMeetingPoint}
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
      {hostSheets.hostManageSheet}
    </>
  );
};

