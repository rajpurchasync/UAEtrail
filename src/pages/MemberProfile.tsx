import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import type { BuddyRelationshipDTO } from '@uaetrail/shared-types';
import type { PersonPublicProfileDTO } from '../api/types';
import {
  acceptMemberBuddyRequest,
  cancelMemberBuddyRequest,
  declineMemberBuddyRequest,
  sendMemberBuddyRequest,
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
  proMembershipPath,
  SIGNIN_PATH,
} from '../config/routingCatalog';
import {
  MEMBER_DISCOVERY_QUOTA_GATE_BODY,
  MEMBER_DISCOVERY_QUOTA_GATE_CTA,
  MEMBER_DISCOVERY_QUOTA_GATE_TITLE,
} from '../content/exploreGoingPanelCopy';
import { resolveMobileBackChrome } from '../utils/mobileBackNav';
import { ExploreGuestSignInCard } from '../explore/ui/ExploreGuestSignInCard';

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
  const backChrome = useMemo(
    () => resolveMobileBackChrome(location.state, { fallbackTo: myActivitiesPath(), label: 'Back' }),
    [location.state]
  );
  const [buddyBusy, setBuddyBusy] = useState(false);
  const [buddyMessage, setBuddyMessage] = useState<string | null>(null);

  const {
    profile,
    viewerAccess,
    loading,
    error,
    discoveryUpgradeRequired,
    upcomingActivities,
    buddyRel,
    setBuddyRel,
    reloadBuddy,
    refreshProfile,
  } = useMemberProfilePage({
    userId,
    viewerId: user?.id,
    previewAsPublic,
    fromDiscover,
  });

  const handleSendBuddyRequest = async () => {
    if (!userId || buddyBusy) return;
    setBuddyBusy(true);
    setBuddyMessage(null);
    try {
      const request = await sendMemberBuddyRequest(userId);
      setBuddyRel((prev: BuddyRelationshipDTO | null) =>
        prev
          ? {
              ...prev,
              areBuddies: request.status === 'accepted',
              outgoingRequest: request.status === 'pending' ? request : null,
              incomingRequest: null,
              canSendRequest: false,
            }
          : null
      );
      setBuddyMessage(request.status === 'accepted' ? 'You are now friends.' : 'Friend request sent.');
      if (request.status === 'accepted') {
        await refreshProfile();
      }
    } catch (err) {
      setBuddyMessage(err instanceof Error ? err.message : 'Could not send buddy request.');
    } finally {
      setBuddyBusy(false);
    }
  };

  const handleAcceptBuddyRequest = async () => {
    if (!buddyRel?.incomingRequest || buddyBusy) return;
    setBuddyBusy(true);
    setBuddyMessage(null);
    try {
      await acceptMemberBuddyRequest(buddyRel.incomingRequest.id);
      setBuddyMessage('Friend request accepted.');
      await reloadBuddy();
      await refreshProfile();
    } catch (err) {
      setBuddyMessage(err instanceof Error ? err.message : 'Could not accept request.');
    } finally {
      setBuddyBusy(false);
    }
  };

  const handleDeclineBuddyRequest = async () => {
    if (!buddyRel?.incomingRequest || buddyBusy) return;
    setBuddyBusy(true);
    setBuddyMessage(null);
    try {
      await declineMemberBuddyRequest(buddyRel.incomingRequest.id);
      setBuddyMessage('Buddy request declined.');
      await reloadBuddy();
    } catch (err) {
      setBuddyMessage(err instanceof Error ? err.message : 'Could not decline request.');
    } finally {
      setBuddyBusy(false);
    }
  };

  const handleCancelBuddyRequest = async () => {
    if (!buddyRel?.outgoingRequest || buddyBusy) return;
    setBuddyBusy(true);
    setBuddyMessage(null);
    try {
      await cancelMemberBuddyRequest(buddyRel.outgoingRequest.id);
      setBuddyMessage('Buddy request cancelled.');
      await reloadBuddy();
    } catch (err) {
      setBuddyMessage(err instanceof Error ? err.message : 'Could not cancel request.');
    } finally {
      setBuddyBusy(false);
    }
  };

  const fullProfile = profile && isFullProfile(profile) ? profile : null;

  const isSelf = user?.id === userId;
  const guestSignInRequired = viewerAccess?.gateReason === 'sign_in' && !user;
  const isPrivate =
    profile?.visibilityState === 'private' && viewerAccess?.exposure === 'none' && !guestSignInRequired;
  const pageTitle = fullProfile?.displayName ?? 'Member';

  return (
    <ConsumerShell
      layout="stack"
      title={pageTitle}
      navTitle={pageTitle.length > 18 ? `${pageTitle.slice(0, 16)}…` : pageTitle}
      showJourney={false}
      back={backChrome}
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
          canViewFullProfile={viewerAccess?.canViewFullProfile ?? false}
          isSelf={Boolean(isSelf)}
          userId={userId}
          userLoggedIn={Boolean(user)}
          buddyRel={buddyRel}
          buddyBusy={buddyBusy}
          buddyMessage={buddyMessage}
          onBuddyMessage={setBuddyMessage}
          onSendBuddyRequest={() => void handleSendBuddyRequest()}
          onAcceptBuddyRequest={() => void handleAcceptBuddyRequest()}
          onDeclineBuddyRequest={() => void handleDeclineBuddyRequest()}
          onCancelBuddyRequest={() => void handleCancelBuddyRequest()}
          onMessage={() => navigate(messagesRouteForRole(user!.role, fullProfile.id))}
          upcomingActivities={upcomingActivities}
        />
      ) : null}
    </ConsumerShell>
  );
};
