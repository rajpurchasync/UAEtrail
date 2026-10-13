import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { ProfileViewerAccessDTO } from '@uaetrail/shared-types';
import { Loader2, Lock } from 'lucide-react';
import type { ActivityDTO, BuddyRelationshipDTO } from '@uaetrail/shared-types';
import type { PersonPublicProfileDTO } from '../api/types';
import {
  acceptMemberBuddyRequest,
  cancelMemberBuddyRequest,
  declineMemberBuddyRequest,
  fetchBuddyRelationship,
  sendMemberBuddyRequest,
} from '../hooks/memberPeopleClientApi';
import {
  fetchMeProfilePublicPreview,
  fetchPersonPublicProfile,
  fetchPersonUpcomingActivities,
} from '../hooks/memberPublicProfileApi';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { MemberProfileView } from '../components/profile/MemberProfileView';
import { PageMeta } from '../components/seo/PageMeta';
import { useAuth } from '../context/AuthContext';
import { messagesRouteForRole } from '../utils/authRouting';
import { EXPLORE_MAP_PATH, myActivitiesPath, proMembershipPath, SIGNIN_PATH } from '../config/routingCatalog';
import {
  MEMBER_DISCOVERY_QUOTA_GATE_BODY,
  MEMBER_DISCOVERY_QUOTA_GATE_CTA,
  MEMBER_DISCOVERY_QUOTA_GATE_TITLE,
} from '../content/exploreGoingPanelCopy';
import { parseProfileReturnNavState } from '../utils/profileReturnNav';
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
  const profileReturn = parseProfileReturnNavState(location.state);
  const [profile, setProfile] = useState<PersonPublicProfileDTO | null>(null);
  const [buddyRel, setBuddyRel] = useState<BuddyRelationshipDTO | null>(null);
  const [buddyBusy, setBuddyBusy] = useState(false);
  const [buddyMessage, setBuddyMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingActivities, setUpcomingActivities] = useState<ActivityDTO[]>([]);
  const [viewerAccess, setViewerAccess] = useState<ProfileViewerAccessDTO | null>(null);
  const [discoveryUpgradeRequired, setDiscoveryUpgradeRequired] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    setDiscoveryUpgradeRequired(false);
    const load =
      previewAsPublic && user?.id === userId
        ? fetchMeProfilePublicPreview()
        : fetchPersonPublicProfile(userId, { discover: fromDiscover });
    void load
      .then(({ profile: loaded, viewerAccess: access }) => {
        setProfile(loaded);
        setViewerAccess(access);
      })
      .catch((err) => {
        const apiErr = err as Error & { code?: string };
        if (apiErr.code === 'upgrade_required' && fromDiscover) {
          setDiscoveryUpgradeRequired(true);
          setError(null);
          setProfile(null);
          return;
        }
        const message = err instanceof Error ? err.message : 'We couldn\'t find this profile';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [userId, previewAsPublic, fromDiscover, user?.id]);

  useEffect(() => {
    if (!userId || viewerAccess?.exposure !== 'full') {
      setUpcomingActivities([]);
      return;
    }
    void fetchPersonUpcomingActivities(userId)
      .then(setUpcomingActivities)
      .catch(() => setUpcomingActivities([]));
  }, [userId, viewerAccess?.exposure]);

  const loadBuddyRelationship = () => {
    if (!userId || !user || user.id === userId) return;
    void fetchBuddyRelationship(userId)
      .then(setBuddyRel)
      .catch(() => setBuddyRel(null));
  };

  useEffect(() => {
    loadBuddyRelationship();
  }, [userId, user?.id]);

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
        void fetchPersonPublicProfile(userId).then(({ profile: loaded, viewerAccess: access }) => {
          setProfile(loaded);
          setViewerAccess(access);
        });
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
      loadBuddyRelationship();
      if (userId) {
        void fetchPersonPublicProfile(userId).then(({ profile: loaded, viewerAccess: access }) => {
          setProfile(loaded);
          setViewerAccess(access);
        });
      }
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
      loadBuddyRelationship();
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
      loadBuddyRelationship();
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
      back={{
        fallbackTo: profileReturn?.from ?? myActivitiesPath(),
        label: profileReturn?.backLabel ?? 'History',
      }}
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
              state={{ from: `/member/${profile.id}` }}
              className="mt-4 inline-block text-sm font-semibold text-emerald-700"
            >
              Sign in
            </Link>
          ) : null}
        </GlassCard>
      ) : fullProfile && userId ? (
        <MemberProfileView
          profile={fullProfile}
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
