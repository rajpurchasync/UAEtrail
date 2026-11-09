import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import {
  activityJoinIsFull,
  activityScheduleHasEnded,
  type ReviewDTO,
} from '@uaetrail/shared-types';
import { activityReviewsQueryKey } from '../hooks/clientQueryKeys';
import { useActivityReviews } from '../hooks/useActivityReviews';
import { useActivityHostJoinRequests } from '../hooks/useActivityHostJoinRequests';
import { activityDetailPath, detailBackPath } from '../config/routingCatalog';
import { readDetailBackToFromLocation } from '../explore/mapPeekDetailNavState';
import { MobileBackButton } from '../components/mobile/MobileBackButton';
import {
  ACTIVITY_JOIN_CTA_SELECTOR,
  AUTH_RESUME_INVITE_FRIENDS_QUERY,
  AUTH_RESUME_JOIN_QUERY,
  AUTH_RESUME_SHARE_QUERY,
  navigateToAuthGate,
  signInPathForReturn,
  withAuthResumeQuery,
  withAuthResumeShare,
} from '../utils/authReturnContext';
import { useAuth } from '../context/AuthContext';
import { useActivityJoinActions } from '../hooks/useActivityJoinFlow';
import { activityDetailQueryKey } from '../hooks/clientQueryKeys';
import {
  type PublicActivityDetailPayload,
  usePublicActivityDetail,
} from '../hooks/usePublicActivityDetail';
import { useActivityJoinGuardMessage } from '../hooks/useActivityJoinGuardMessage';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { activityEventSchema } from '../components/seo/schemas';
import { activityPublicMetaDescription } from '../utils/activityPublicSeo';
import { resolveActivityHeroImage } from '../utils/activityHeroImage';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import { JoinRequestModal, WithdrawRequestModal } from '../components/ui';
import { DETAIL_LOADING_ACTIVITY } from '../content/detailLoadingCopy';
import { ConsumerEntityDetailLoading } from '../detail/shell/ConsumerEntityDetailLoading';
import { parseMobileBackNavState } from '../utils/mobileBackNav';
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
import { viewerCanManageActivityOuting, viewerIsActivityHostUser } from '../utils/viewerHostsActivity';
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

/**
 * Activity detail **route loader** (`/activity/:id`): fetch, join modals, SEO, host sheets.
 * **L3 kind layout:** `ActivityDetailByKind` → `*ActivityDetailPage` → `ActivityDetailPageShell`
 * (mirrors `PlaceDetailPage` → `PlaceDetailPageShell`).
 */
export const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const gate = useMemberStatus({ enabled: Boolean(user) });
  const navigate = useNavigate();
  const location = useLocation();
  const detailBackTo = readDetailBackToFromLocation(location.state);
  const [searchParams, setSearchParams] = useSearchParams();
  const fromJoinInvite = searchParams.get('invite') === '1';
  const resumeJoinAfterAuth = searchParams.get(AUTH_RESUME_JOIN_QUERY) === '1';
  const resumeInviteFriendsAfterAuth =
    searchParams.get(AUTH_RESUME_INVITE_FRIENDS_QUERY) === '1';
  const resumeShareAfterAuth = searchParams.get(AUTH_RESUME_SHARE_QUERY) === '1';
  const joinInviteAutoOpenRef = useRef(false);
  const resumeJoinHandledRef = useRef(false);
  const resumeInviteHandledRef = useRef(false);
  const resumeShareHandledRef = useRef(false);
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
    resumeInviteHandledRef.current = false;
  }, [id]);

  const joinUiState = resolveJoinRequestUiState({
    myRequest: myRequest ?? null,
    participation: participation ?? null,
  });

  const joinGuardMessage = useActivityJoinGuardMessage(activity?.requirements, user?.id);

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

  const activityParticipantCheckedIn = Boolean(participation?.checkedInAt);
  const canWriteActivityReview =
    activityParticipantCheckedIn &&
    Boolean(activity && activityScheduleHasEnded(activity));

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

  const canManageActivityOuting = Boolean(
    activity &&
      user &&
      detailExposure !== 'none' &&
      viewerCanManageActivityOuting(activity, user.id, user.role)
  );

  const {
    joinRequests: hostJoinRequests,
    loading: hostJoinRequestsLoading,
    refetch: refetchHostJoinRequests,
  } = useActivityHostJoinRequests({
    tenantId: gate.tenantId,
    activityId: id,
    enabled: isActivityHostUser,
  });

  const loadHostJoinRequests = useCallback(() => {
    void refetchHostJoinRequests();
  }, [refetchHostJoinRequests]);

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

  const requiresSignIn = Boolean(
    !user &&
      (viewerAccess?.gateReason === 'sign_in' ||
        (viewerAccess?.exposure === 'none' &&
          viewerAccess.gateReason !== 'invite_only' &&
          !viewerAccess.canViewFullActivity))
  );
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
    inviteShare.openShareFromActivity(activity, { canSendBuddyInvites: true });
  }, [activity, inviteShare]);

  const onParticipantInviteFriends = useCallback(() => {
    if (!activity || activity.status !== 'published') return;
    inviteShare.openShareFromActivity(activity, { canSendBuddyInvites: true });
  }, [activity, inviteShare]);

  const onGuestShareAuth = useCallback(() => {
    if (!id) return;
    navigateToAuthGate(navigate, location, {
      returnPath: withAuthResumeShare(`/activity/${id}`),
    });
  }, [id, navigate, location]);

  const openActivityShareSheet = useCallback(() => {
    if (!activity || activity.status !== 'published') return;
    inviteShare.openShareFromActivity(activity, {
      canSendBuddyInvites: Boolean(user),
    });
  }, [activity, inviteShare, user]);

  const handleShareOutingPress = useCallback(() => {
    if (!activity || activity.status !== 'published') return;
    if (!user) {
      onGuestShareAuth();
      return;
    }
    if (isActivityHostUser) {
      onHostShareOuting();
    } else {
      openActivityShareSheet();
    }
  }, [
    activity,
    user,
    onGuestShareAuth,
    isActivityHostUser,
    onHostShareOuting,
    openActivityShareSheet,
  ]);

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

  useEffect(() => {
    if (!resumeInviteFriendsAfterAuth || loading || !activity || resumeInviteHandledRef.current) {
      return;
    }
    if (!user) return;
    if (activity.status !== 'published') return;
    resumeInviteHandledRef.current = true;
    inviteShare.openShareFromActivity(activity, { canSendBuddyInvites: true });
    const next = new URLSearchParams(searchParams);
    next.delete(AUTH_RESUME_INVITE_FRIENDS_QUERY);
    setSearchParams(next, { replace: true });
  }, [
    resumeInviteFriendsAfterAuth,
    loading,
    activity,
    user,
    inviteShare,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (!resumeShareAfterAuth || loading || !activity || resumeShareHandledRef.current) return;
    if (!user) return;
    if (activity.status !== 'published') return;
    resumeShareHandledRef.current = true;
    openActivityShareSheet();
    const next = new URLSearchParams(searchParams);
    next.delete(AUTH_RESUME_SHARE_QUERY);
    setSearchParams(next, { replace: true });
  }, [
    resumeShareAfterAuth,
    loading,
    activity,
    user,
    openActivityShareSheet,
    searchParams,
    setSearchParams,
  ]);

  if (loading) {
    return (
      <>
        <PageMeta title="Loading activity" path={id ? `/activity/${id}` : undefined} />
        <ConsumerEntityDetailLoading
          backTo={detailBackTo ?? detailBackPath('activity')}
          backLabel={parseMobileBackNavState(location.state)?.backLabel ?? 'Explore'}
          headerChrome={{ emoji: '🥾', label: 'Outing' }}
          label={DETAIL_LOADING_ACTIVITY}
        />
      </>
    );
  }

  if (!activity) {
    return (
      <>
        <PageMeta title="Activity not found" noIndex path={id ? `/activity/${id}` : undefined} />
        <div className="app-page-center bg-gray-50">
          <div className="text-center px-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">We couldn&apos;t find this activity</h1>
            <div className="flex justify-center">
              <MobileBackButton
                fallbackTo={detailBackTo ?? detailBackPath('activity')}
                label={detailBackTo ? 'Browse' : 'Activities'}
              />
            </div>
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {(fromJoinInvite || activity.myJoinInvite) && !isConfirmedParticipant ? (
        <p
          className="mx-auto max-w-3xl shrink-0 px-4 pt-4 text-sm font-medium text-emerald-900 bg-emerald-50 border border-emerald-100 rounded-xl py-3"
          role="status"
        >
          {activityJoinInviteBanner(activity.myJoinInvite?.inviterDisplayName)}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ActivityDetailByKind
        activity={activity}
        backTo={detailBackTo ?? detailBackPath('activity')}
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
                    activityDetailQueryKey(id, user?.id ?? 'guest'),
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
        onHostShareOuting={handleShareOutingPress}
        onGuestShareAuth={onGuestShareAuth}
        onOpenHostManage={canManageActivityOuting ? hostSheets.openHostManage : undefined}
        viewerAccess={viewerAccess}
        onOfferLinkedRideshare={
          canOpenLinkedRideshareFlow && activity
            ? () => navigateToCreateLinkedRideshare(navigate, activity)
            : undefined
        }
        onRideshareParentLinked={
          id && user
            ? () => {
                void queryClient.invalidateQueries({ queryKey: activityDetailQueryKey(id, user.id) });
              }
            : undefined
        }
      />
      </div>
      </div>
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
        isFull={activityJoinIsFull({
          slotsTotal: activity.slotsTotal,
          slotsAvailable: activity.slotsAvailable,
        })}
        onSuccess={handleJoinSuccess}
      />
      {hostSheets.hostManageSheet}
    </>
  );
};

