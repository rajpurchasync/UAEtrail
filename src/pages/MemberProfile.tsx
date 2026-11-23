import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import type { FriendRelationshipDTO } from '@uaetrail/shared-types';
import type { PersonPublicProfileDTO } from '../api/types';
import {
  acceptMemberFriendRequest,
  cancelMemberFriendRequest,
  declineMemberFriendRequest,
  sendMemberFriendRequest,
} from '../hooks/memberPeopleClientApi';
/** Public reads: `memberPublicProfileApi` via {@link useMemberProfilePage}. */
import { useMemberProfilePage } from '../hooks/useMemberProfilePage';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { MemberProfileView } from '../components/profile/MemberProfileView';
import { PageMeta } from '../components/seo/PageMeta';
import { useAuth } from '../context/AuthContext';
import { messagesRouteForRole } from '../utils/authRouting';
import {
  EXPLORE_MAP_PATH,
  memberProfileLink,
  myActivitiesPath,
  PROFILE_PATH,
  APP_SETTINGS_PRIVACY_PATH,
  proMembershipPath,
  SIGNIN_PATH,
} from '../config/routingCatalog';
import {
  MEMBER_DISCOVERY_QUOTA_GATE_BODY,
  MEMBER_DISCOVERY_QUOTA_GATE_CTA,
  MEMBER_DISCOVERY_QUOTA_GATE_TITLE,
} from '../content/exploreGoingPanelCopy';
import { profileHubMobileBackState, resolveMobileBackChrome } from '../utils/mobileBackNav';
import { ExploreGuestSignInCard } from '../explore/ui/ExploreGuestSignInCard';
import {
  browseLensForPresentation,
  memberProfileCanTogglePresentation,
  parseMemberProfileBrowseLens,
  presentationFromBrowseLens,
  type MemberProfilePresentationMode,
} from '../member/memberProfilePresentation';
import { memberProfilePath } from '@uaetrail/shared-types';
import {
  canViewMemberPublicCardFields,
  canViewMemberTrustedProfileFields,
} from '../member/memberProfileFieldAccess';

const isFullProfile = (
  profile: PersonPublicProfileDTO
): profile is Extract<PersonPublicProfileDTO, { visibilityState: 'full' }> =>
  profile.visibilityState === 'full';

export const MemberProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const previewAsPublic = searchParams.get('view') === 'public';
  const fromDiscover = searchParams.get('discover') === '1';
  const isSelf = Boolean(user?.id && user.id === userId);
  const backChrome = useMemo(
    () =>
      resolveMobileBackChrome(location.state, {
        fallbackTo: isSelf ? PROFILE_PATH : EXPLORE_MAP_PATH,
        label: isSelf ? 'Profile' : 'Explore',
        backBehavior: 'fallback',
      }),
    [isSelf, location.state]
  );
  const [friendActionBusy, setFriendActionBusy] = useState(false);
  const [friendMessage, setFriendMessage] = useState<string | null>(null);
  const browseLens = useMemo(() => parseMemberProfileBrowseLens(location.search), [location.search]);
  const [presentation, setPresentation] = useState<MemberProfilePresentationMode>('social');
  const [loadSocialGraph, setLoadSocialGraph] = useState(false);
  const [loadMemberActivities, setLoadMemberActivities] = useState(false);

  useEffect(() => {
    if (isSelf) {
      setLoadSocialGraph(true);
      setLoadMemberActivities(true);
    }
  }, [isSelf]);

  const {
    profile,
    viewerAccess,
    loading,
    error,
    discoveryUpgradeRequired,
    upcomingActivities,
    pastActivities,
    activitiesLoading,
    socialGraph,
    socialGraphLoading,
    socialGraphLoadingFriends,
    socialGraphLoadingCommon,
    friendRel,
    setFriendRel,
    reloadFriendRel,
    refreshProfile,
    refreshSocialGraphFriends,
  } = useMemberProfilePage({
    userId,
    viewerId: user?.id,
    previewAsPublic,
    fromDiscover,
    loadSocialGraph,
    loadMemberActivities,
  });

  const handleSendFriendRequest = async () => {
    if (!userId || friendActionBusy) return;
    setFriendActionBusy(true);
    setFriendMessage(null);
    try {
      const request = await sendMemberFriendRequest(userId);
      setFriendRel((prev: FriendRelationshipDTO | null) =>
        prev
          ? {
              ...prev,
              areFriends: request.status === 'accepted',
              outgoingRequest: request.status === 'pending' ? request : null,
              incomingRequest: null,
              canSendRequest: false,
            }
          : null
      );
      setFriendMessage(request.status === 'accepted' ? 'You are now friends.' : 'Friend request sent.');
      if (request.status === 'accepted') {
        setLoadSocialGraph(true);
        await refreshProfile();
        await refreshSocialGraphFriends();
      }
    } catch (err) {
      setFriendMessage(err instanceof Error ? err.message : 'Could not send friend request.');
    } finally {
      setFriendActionBusy(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!friendRel?.incomingRequest || friendActionBusy) return;
    setFriendActionBusy(true);
    setFriendMessage(null);
    try {
      await acceptMemberFriendRequest(friendRel.incomingRequest.id);
      setFriendMessage('Friend request accepted.');
      await reloadFriendRel();
      setLoadSocialGraph(true);
      await refreshProfile();
      await refreshSocialGraphFriends();
    } catch (err) {
      setFriendMessage(err instanceof Error ? err.message : 'Could not accept request.');
    } finally {
      setFriendActionBusy(false);
    }
  };

  const handleDeclineFriendRequest = async () => {
    if (!friendRel?.incomingRequest || friendActionBusy) return;
    setFriendActionBusy(true);
    setFriendMessage(null);
    try {
      await declineMemberFriendRequest(friendRel.incomingRequest.id);
      setFriendMessage('Friend request declined.');
      await reloadFriendRel();
    } catch (err) {
      setFriendMessage(err instanceof Error ? err.message : 'Could not decline request.');
    } finally {
      setFriendActionBusy(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!friendRel?.outgoingRequest || friendActionBusy) return;
    setFriendActionBusy(true);
    setFriendMessage(null);
    try {
      await cancelMemberFriendRequest(friendRel.outgoingRequest.id);
      setFriendMessage('Friend request cancelled.');
      await reloadFriendRel();
    } catch (err) {
      setFriendMessage(err instanceof Error ? err.message : 'Could not cancel request.');
    } finally {
      setFriendActionBusy(false);
    }
  };

  const fullProfile = profile && isFullProfile(profile) ? profile : null;

  const showPresentationSwitch = Boolean(
    fullProfile &&
      memberProfileCanTogglePresentation({
        canViewFullProfile: viewerAccess?.canViewFullProfile ?? false,
        isHost: fullProfile.isHost,
        activitiesHosted: fullProfile.stats?.activitiesHosted ?? 0,
        publishingTenantId: fullProfile.publishingTenantId,
      })
  );

  useEffect(() => {
    if (!fullProfile) return;
    setPresentation(presentationFromBrowseLens(browseLens, fullProfile.isHost));
  }, [userId, browseLens, fullProfile?.isHost, fullProfile]);

  const handlePresentationChange = (next: MemberProfilePresentationMode) => {
    setPresentation(next);
    if (!userId) return;
    const lens = browseLensForPresentation(next);
    const path = memberProfilePath(userId, {
      lens,
      discover: fromDiscover,
      publicPreview: previewAsPublic,
    });
    if (path) {
      navigate(path, { replace: true, state: location.state });
    }
  };

  const guestSignInRequired = viewerAccess?.gateReason === 'sign_in' && !user;
  const isPrivate =
    profile?.visibilityState === 'private' && viewerAccess?.exposure === 'none' && !guestSignInRequired;
  const pageTitle = fullProfile?.displayName ?? (isSelf ? user?.displayName || 'Profile' : 'Member');
  /** Shell chrome only — name lives in `MemberProfileView`. */
  const shellTitle = isSelf ? 'Profile' : 'Member';

  useEffect(() => {
    if (!fullProfile || location.hash !== '#reviews') return;
    const timer = window.setTimeout(() => {
      document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [fullProfile, location.hash]);

  return (
    <ConsumerShell
      layout="stack"
      title={shellTitle}
      navTitle={shellTitle}
      showJourney={false}
      back={backChrome}
      closeTo={isSelf ? undefined : EXPLORE_MAP_PATH}
    >
      <PageMeta title={pageTitle} noIndex />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : discoveryUpgradeRequired ? (
        <GlassCard padding className="text-center">
          <h1 className="text-lg font-bold text-neutral-900">{MEMBER_DISCOVERY_QUOTA_GATE_TITLE}</h1>
          <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{MEMBER_DISCOVERY_QUOTA_GATE_BODY}</p>
          <Link
            to={proMembershipPath({
              intent: 'discover-members',
              redirect: `${EXPLORE_MAP_PATH}?view=people&list=1`,
            })}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {MEMBER_DISCOVERY_QUOTA_GATE_CTA}
          </Link>
          <Link to={myActivitiesPath()} className="mt-3 block text-sm font-semibold text-emerald-700">
            Back to my activities
          </Link>
        </GlassCard>
      ) : error || !profile ? (
        <GlassCard padding className="text-center">
          <p className="text-sm text-neutral-600">{error ?? 'We couldn\'t find this profile'}</p>
          <Link to={myActivitiesPath()} className="mt-3 inline-block text-sm font-semibold text-emerald-700">
            Back to my activities
          </Link>
        </GlassCard>
      ) : guestSignInRequired ? (
        <ExploreGuestSignInCard intent="member-profile" />
      ) : isPrivate && isSelf && previewAsPublic ? (
        <GlassCard padding className="!p-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Lock className="h-7 w-7 text-neutral-500" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-neutral-900">Private profile</h2>
          <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
            This is what other people see. Your profile stays hidden until you make it public or share it with friends.
          </p>
          <Link
            to={APP_SETTINGS_PRIVACY_PATH}
            state={profileHubMobileBackState()}
            className="mt-4 inline-block text-sm font-semibold text-emerald-700"
          >
            Change visibility
          </Link>
        </GlassCard>
      ) : isPrivate ? (
        <GlassCard padding className="!p-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Lock className="h-7 w-7 text-neutral-500" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-neutral-900">Profile not available</h1>
          <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{profile.message}</p>
          {!user ? (
            <Link
              to={SIGNIN_PATH}
              state={{ from: memberProfileLink(profile.id) }}
              className="mt-4 inline-block text-sm font-semibold text-emerald-700"
            >
              Sign in
            </Link>
          ) : null}
        </GlassCard>
      ) : fullProfile && userId ? (
        <MemberProfileView
          profile={fullProfile}
          canViewPublicCardFields={canViewMemberPublicCardFields(viewerAccess)}
          canViewTrustedFields={canViewMemberTrustedProfileFields(viewerAccess)}
          isSelf={Boolean(isSelf)}
          userId={userId}
          userLoggedIn={Boolean(user)}
          friendRel={friendRel}
          friendActionBusy={friendActionBusy}
          friendMessage={friendMessage}
          onFriendMessage={setFriendMessage}
          onSendFriendRequest={() => void handleSendFriendRequest()}
          onAcceptFriendRequest={() => void handleAcceptFriendRequest()}
          onDeclineFriendRequest={() => void handleDeclineFriendRequest()}
          onCancelFriendRequest={() => void handleCancelFriendRequest()}
          onMessage={() => navigate(messagesRouteForRole(user!.role, fullProfile.id))}
          upcomingActivities={upcomingActivities}
          pastActivities={pastActivities}
          activitiesLoading={activitiesLoading}
          activitiesDeferActive={Boolean(viewerAccess?.canOpenMemberProfile)}
          onRequestMemberActivities={() => setLoadMemberActivities(true)}
          socialGraph={socialGraph}
          socialGraphLoading={socialGraphLoading}
          socialGraphLoadingFriends={socialGraphLoadingFriends}
          socialGraphLoadingCommon={socialGraphLoadingCommon}
          socialGraphDeferActive={Boolean(viewerAccess?.canOpenMemberProfile)}
          onRequestSocialGraph={() => setLoadSocialGraph(true)}
          presentation={presentation}
          onPresentationChange={showPresentationSwitch ? handlePresentationChange : undefined}
          showPresentationSwitch={showPresentationSwitch}
        />
      ) : null}
    </ConsumerShell>
  );
};
