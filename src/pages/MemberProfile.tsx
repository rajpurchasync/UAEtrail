import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import type { ActivityDTO, BuddyRelationshipDTO } from '@uaetrail/shared-types';
import { api, type PersonPublicProfileDTO } from '../api/index';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { MemberProfileView } from '../components/profile/MemberProfileView';
import { PageMeta } from '../components/seo/PageMeta';
import { useAuth } from '../context/AuthContext';
import { buildProfileStamps } from '../utils/profileStamps';
import { messagesRouteForRole } from '../utils/authRouting';
import { myActivitiesPath } from '../utils/exploreRouting';

const isFullProfile = (
  profile: PersonPublicProfileDTO
): profile is Extract<PersonPublicProfileDTO, { visibilityState: 'full' }> =>
  profile.visibilityState === 'full';

export const MemberProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PersonPublicProfileDTO | null>(null);
  const [buddyRel, setBuddyRel] = useState<BuddyRelationshipDTO | null>(null);
  const [buddyBusy, setBuddyBusy] = useState(false);
  const [buddyMessage, setBuddyMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostedActivities, setHostedActivities] = useState<ActivityDTO[]>([]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    void api
      .getPersonPublicProfile(userId)
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'We couldn\'t find this profile'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const hostPath =
      profile && profile.visibilityState === 'full' ? profile.hostProfilePath : null;
    if (!hostPath?.startsWith('/operator/')) {
      setHostedActivities([]);
      return;
    }
    const slug = hostPath.slice('/operator/'.length);
    if (!slug) {
      setHostedActivities([]);
      return;
    }
    void api
      .getOrganisationProfile(slug)
      .then((res) => setHostedActivities(res.data.activities ?? []))
      .catch(() => setHostedActivities([]));
  }, [profile]);

  const loadBuddyRelationship = () => {
    if (!userId || !user || user.id === userId) return;
    void api
      .getBuddyRelationship(userId)
      .then((res) => setBuddyRel(res.data))
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
      const res = await api.sendBuddyRequest({ targetUserId: userId });
      setBuddyRel((prev: BuddyRelationshipDTO | null) =>
        prev
          ? {
              ...prev,
              areBuddies: res.data.status === 'accepted',
              outgoingRequest: res.data.status === 'pending' ? res.data : null,
              incomingRequest: null,
              canSendRequest: false,
            }
          : null
      );
      setBuddyMessage(res.data.status === 'accepted' ? 'You are now connected.' : 'Buddy request sent.');
      if (res.data.status === 'accepted') {
        void api.getPersonPublicProfile(userId).then((profileRes) => setProfile(profileRes.data));
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
      await api.acceptBuddyRequest(buddyRel.incomingRequest.id);
      setBuddyMessage('Buddy request accepted.');
      loadBuddyRelationship();
      if (userId) {
        void api.getPersonPublicProfile(userId).then((profileRes) => setProfile(profileRes.data));
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
      await api.declineBuddyRequest(buddyRel.incomingRequest.id);
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
      await api.cancelBuddyRequest(buddyRel.outgoingRequest.id);
      setBuddyMessage('Buddy request cancelled.');
      loadBuddyRelationship();
    } catch (err) {
      setBuddyMessage(err instanceof Error ? err.message : 'Could not cancel request.');
    } finally {
      setBuddyBusy(false);
    }
  };

  const fullProfile = profile && isFullProfile(profile) ? profile : null;

  const stamps = fullProfile
    ? buildProfileStamps({
        attendedCount: fullProfile.stats.activitiesAttended,
        hostedCount: fullProfile.stats.activitiesHosted,
        isHost: fullProfile.isHost && fullProfile.hostProfileKind !== 'shop',
        hostProfileKind: fullProfile.hostProfileKind,
        isGuideStaff: fullProfile.isGuideStaff,
        rewardSummary: fullProfile.trailPointsEligible
          ? ({
              points: fullProfile.points,
              membershipTier: fullProfile.membershipTier,
              tierBadges: fullProfile.tierBadges,
              badges: fullProfile.badges,
            } as never)
          : null,
      })
    : [];

  const isSelf = user?.id === userId;
  const isPrivate = profile?.visibilityState === 'private';
  const pageTitle = fullProfile?.displayName ?? 'Member';

  return (
    <ConsumerShell
      layout="stack"
      title={pageTitle}
      navTitle={pageTitle.length > 18 ? `${pageTitle.slice(0, 16)}…` : pageTitle}
      showJourney={false}
      back={{ fallbackTo: myActivitiesPath(), label: 'My activities' }}
    >
      <PageMeta title={pageTitle} noIndex />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : error || !profile ? (
        <GlassCard padding className="text-center">
          <p className="text-sm text-neutral-600">{error ?? 'We couldn\'t find this profile'}</p>
          <Link to={myActivitiesPath()} className="mt-3 inline-block text-sm font-semibold text-emerald-700">
            Back to my activities
          </Link>
        </GlassCard>
      ) : isPrivate ? (
        <GlassCard padding className="!p-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Lock className="h-7 w-7 text-neutral-500" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-neutral-900">Private profile</h1>
          <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{profile.message}</p>
          {!user && (
            <Link
              to="/signin"
              state={{ from: `/member/${profile.id}` }}
              className="mt-4 inline-block text-sm font-semibold text-emerald-700"
            >
              Log in if you are friends or share an activity
            </Link>
          )}
        </GlassCard>
      ) : fullProfile && userId ? (
        <MemberProfileView
          profile={fullProfile}
          stamps={stamps}
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
          hostedActivities={hostedActivities}
        />
      ) : null}
    </ConsumerShell>
  );
};
