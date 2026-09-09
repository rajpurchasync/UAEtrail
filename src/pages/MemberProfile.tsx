import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Lock, UserPlus } from 'lucide-react';
import type { BuddyRelationshipDTO } from '@uaetrail/shared-types';
import { api, type PublicMemberProfileDTO } from '../api/services';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { AppButton } from '../components/mobile/AppButton';
import { ProfileStampsRow } from '../components/profile/ProfileStampsRow';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { FavoriteButton } from '../components/ui/FavoriteButton';
import { PageMeta } from '../components/seo/PageMeta';
import { useAuth } from '../context/AuthContext';
import { buildProfileStamps } from '../utils/profileStamps';
import { formatMemberAge } from '../utils/profileAge';
import { messagesRouteForRole } from '../utils/authRouting';

const isFullProfile = (
  profile: PublicMemberProfileDTO
): profile is Extract<PublicMemberProfileDTO, { visibilityState: 'full' }> =>
  profile.visibilityState === 'full';

export const MemberProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicMemberProfileDTO | null>(null);
  const [buddyRel, setBuddyRel] = useState<BuddyRelationshipDTO | null>(null);
  const [buddyBusy, setBuddyBusy] = useState(false);
  const [buddyMessage, setBuddyMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    void api
      .getUserPublicProfile(userId)
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'We couldn\'t find this profile'))
      .finally(() => setLoading(false));
  }, [userId]);

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
        void api.getUserPublicProfile(userId).then((profileRes) => setProfile(profileRes.data));
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
        void api.getUserPublicProfile(userId).then((profileRes) => setProfile(profileRes.data));
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

  const fullProfile = profile && isFullProfile(profile) ? profile : null;

  const stamps = fullProfile
    ? buildProfileStamps({
        attendedCount: fullProfile.stats.tripsAttended,
        hostedCount: fullProfile.stats.tripsHosted,
        isHost: fullProfile.isHost && fullProfile.hostProfileKind !== 'shop',
        hostProfileKind: fullProfile.hostProfileKind,
        isGuideStaff: fullProfile.isGuideStaff,
        rewardSummary: fullProfile.trailPointsEligible
          ? {
              points: fullProfile.points,
              membershipTier: fullProfile.membershipTier,
              tierBadges: fullProfile.tierBadges,
              badges: fullProfile.badges,
            } as never
          : null,
      })
    : [];

  const isSelf = user?.id === userId;
  const isPrivate = profile?.visibilityState === 'private';

  return (
    <ConsumerShell
      layout="stack"
      title="Member"
      showJourney={false}
      back={{ fallbackTo: '/activities', label: 'Activities' }}
    >
      <PageMeta title={fullProfile?.displayName ?? 'Member profile'} noIndex />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : error || !profile ? (
        <GlassCard padding className="text-center">
          <p className="text-sm text-neutral-600">{error ?? 'We couldn\'t find this profile'}</p>
          <Link to="/activities" className="mt-3 inline-block text-sm font-semibold text-emerald-700">
            Back to activities
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
              Log in if you are friends or share a trip
            </Link>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-3 pb-nav-safe">
          <GlassCard padding className="!p-5 text-center">
            <SecureAvatar
              src={fullProfile!.avatarUrl}
              name={fullProfile!.displayName}
              className="mx-auto h-20 w-20 text-xl ring-2 ring-white shadow-md"
            />
            {!isSelf && user && userId && (
              <div className="mt-3 flex justify-center">
                <FavoriteButton profileUserId={userId} />
              </div>
            )}
            <h1 className="mt-3 text-xl font-bold text-neutral-900">{fullProfile!.displayName}</h1>
            {(fullProfile!.age != null || fullProfile!.languages) && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                {formatMemberAge(fullProfile!.age) && (
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                    {formatMemberAge(fullProfile!.age)}
                  </span>
                )}
                {fullProfile!.languages && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {fullProfile!.languages}
                  </span>
                )}
              </div>
            )}
            {fullProfile!.bio && (
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{fullProfile!.bio}</p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 text-left">
              <div className="rounded-xl bg-neutral-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Trips attended</p>
                <p className="text-lg font-bold text-neutral-900">{fullProfile!.stats.tripsAttended}</p>
              </div>
              <div className="rounded-xl bg-neutral-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Trips hosted</p>
                <p className="text-lg font-bold text-neutral-900">{fullProfile!.stats.tripsHosted}</p>
              </div>
            </div>

            <div className="mt-4">
              <ProfileStampsRow stamps={stamps} />
            </div>

            {!isSelf && user && buddyRel && (
              <div className="mt-4 space-y-2">
                {buddyRel.areBuddies ? (
                  <p className="text-xs font-semibold text-emerald-700">Connected as buddies</p>
                ) : buddyRel.incomingRequest ? (
                  <div className="flex gap-2">
                    <AppButton
                      type="button"
                      className="flex-1"
                      disabled={buddyBusy}
                      onClick={() => void handleAcceptBuddyRequest()}
                    >
                      Accept buddy
                    </AppButton>
                    <AppButton
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      disabled={buddyBusy}
                      onClick={() => void handleDeclineBuddyRequest()}
                    >
                      Decline
                    </AppButton>
                  </div>
                ) : buddyRel.outgoingRequest ? (
                  <p className="text-xs font-semibold text-neutral-600">Buddy request sent</p>
                ) : buddyRel.canSendRequest ? (
                  <AppButton
                    type="button"
                    className="w-full"
                    disabled={buddyBusy}
                    onClick={() => void handleSendBuddyRequest()}
                  >
                    <UserPlus className="mr-2 inline h-4 w-4" />
                    Add buddy
                  </AppButton>
                ) : null}
                {buddyMessage && <p className="text-xs text-neutral-600">{buddyMessage}</p>}
              </div>
            )}

            {!isSelf && user && (
              <AppButton
                type="button"
                className="mt-4 w-full"
                onClick={() => navigate(messagesRouteForRole(user.role, fullProfile!.id))}
              >
                Message
              </AppButton>
            )}

            {!isSelf && !user && (
              <Link
                to="/signin"
                state={{ from: `/member/${fullProfile!.id}` }}
                className="mt-4 inline-block text-sm font-semibold text-emerald-700"
              >
                Log in to say hi
              </Link>
            )}

            {fullProfile!.hostProfilePath && (
              <Link
                to={fullProfile!.hostProfilePath}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700"
              >
                View host profile
              </Link>
            )}
          </GlassCard>

          <GlassCard padding>
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">What you can see</p>
            <ul className="text-sm text-neutral-600 space-y-1.5">
              <li>Public name, photo, bio, age, and languages</li>
              <li>My Badges and trip counts</li>
              <li>Host profile link when they lead trips</li>
            </ul>
          </GlassCard>
        </div>
      )}
    </ConsumerShell>
  );
};
