import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/index';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { ConsumerErrorCard } from '../components/mobile/ConsumerFeedback';
import { AccountAvatarModal } from '../components/account';
import { useParticipantHubData } from '../hooks/useParticipantHubData';
import { useOrganisationGate } from '../hooks/useOrganisationGate';
import { MembershipTierBadge } from '../components/ui/MembershipTierBadge';
import { TrailPointsPathSheet } from '../components/rewards';
import { RewardSummaryDTO } from '@uaetrail/shared-types';
import { ProfileHeroSection } from '../components/profile/ProfileHeroSection';
import { ProfileHubMenu } from '../components/profile/ProfileHubMenu';
import { ProfileUpNextStrip } from '../components/profile/ProfileUpNextStrip';
import { ProfileBioCard } from '../components/profile/ProfileBioCard';
import { ProfileLanguagesCard } from '../components/profile/ProfileLanguagesCard';
import { buildProfileCompletion } from '../utils/profileCompletion';
import { resolveProfileSharePath, resolveProfileShareText } from '../utils/profileShare';
import { USER_CITY_LABELS } from '../constants/userProfileOptions';
import { formatMemberJoinedLabel } from '../utils/formatMemberSince';
import { profileVisibilityLabel } from '../utils/profileVisibilityLabel';
import { resolveProfileHostKind, resolveProfileRoleLabel } from '../utils/profileRoleLabel';
import { isHostRole } from '../utils/roles';

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    profile,
    setProfile,
    incomingBuddyRequests,
    upcomingPlans,
    loading,
    error,
    reload,
  } = useParticipantHubData();

  const { ownedProfiles, loading: hostGateLoading } = useOrganisationGate({ enabled: Boolean(user) });

  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const [rewardSummary, setRewardSummary] = useState<RewardSummaryDTO | null>(null);
  const [showPointsPath, setShowPointsPath] = useState(false);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'group_members' | 'private'>('public');

  useEffect(() => {
    if (!user) return;
    void api.getMeProfile().then((profileRes) => {
      setMemberSince(profileRes.data.memberSince ?? null);
      setVisibility(profileRes.data.profileVisibility ?? 'public');
    }).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void api.getMyRewards()
      .then((res) => setRewardSummary(res.data))
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    const state = location.state as { openEdit?: boolean } | null;
    if (!state?.openEdit) return;
    navigate('/profile/edit', { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const trailPointsEligible = rewardSummary?.trailPointsEligible !== false;
  const hostProfileKind = useMemo(() => resolveProfileHostKind(ownedProfiles), [ownedProfiles]);
  const canHost = isHostRole(user?.role);
  const isActivityHost = canHost && hostProfileKind !== 'shop';
  const displayName = profile.displayName || user!.displayName || 'Explorer';
  const roleLabel = resolveProfileRoleLabel(user?.role, ownedProfiles);
  const avatarUrl = profile.avatarUrl ?? user?.avatarUrl ?? null;
  const profileCityLabel = profile.city ? USER_CITY_LABELS[profile.city] : null;
  const memberSinceLabel = memberSince ? formatMemberJoinedLabel(memberSince) : null;

  const completion = useMemo(
    () =>
      buildProfileCompletion({
        displayName,
        avatarUrl,
        bio: profile.bio,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        countryCode: profile.countryCode,
        city: profile.city,
        languages: profile.languages,
      }),
    [
      avatarUrl,
      displayName,
      profile.bio,
      profile.countryCode,
      profile.city,
      profile.dateOfBirth,
      profile.gender,
      profile.languages,
      profile.phone,
    ]
  );

  const sharePath = useMemo(
    () =>
      resolveProfileSharePath(ownedProfiles, {
        referralCode: rewardSummary?.referralCode,
      }),
    [ownedProfiles, rewardSummary?.referralCode]
  );
  const shareText = resolveProfileShareText(displayName, ownedProfiles);
  const shareReady = !hostGateLoading || ownedProfiles.length > 0 || Boolean(rewardSummary?.referralCode);

  const buddyBadge = incomingBuddyRequests.length > 0 ? incomingBuddyRequests.length : undefined;

  const openPublicProfile = useCallback(() => {
    if (!user?.id) return;
    navigate(`/member/${user.id}`);
  }, [navigate, user?.id]);

  const openEdit = useCallback(() => {
    navigate('/profile/edit');
  }, [navigate]);

  const openAvatarEdit = useCallback(() => {
    setAvatarMessage(null);
    setShowAvatarEdit(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    await reload();
    if (!user) return;
    void api.getMeProfile().then((profileRes) => {
      setMemberSince(profileRes.data.memberSince ?? null);
      setVisibility(profileRes.data.profileVisibility ?? 'public');
    });
  }, [reload, user]);

  const saveAvatar = async (nextAvatarUrl: string) => {
    setAvatarMessage(null);
    setAvatarSaving(true);
    try {
      await api.updateMeProfile({ avatarUrl: nextAvatarUrl });
      setProfile((prev) => ({ ...prev, avatarUrl: nextAvatarUrl }));
      await refreshUser();
      setAvatarMessage('Photo saved.');
      setShowAvatarEdit(false);
      await reload();
    } catch (err) {
      setAvatarMessage(err instanceof Error ? err.message : 'Couldn\'t save your photo — try again.');
    } finally {
      setAvatarSaving(false);
    }
  };

  const heroExtra = (
    <div className="flex flex-col items-center gap-2">
      {profileCityLabel ? (
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
          📍 {profileCityLabel}
        </span>
      ) : null}
      {trailPointsEligible && rewardSummary?.membershipTier && rewardSummary.membershipTier.key !== 'free' ? (
        <MembershipTierBadge
          tierKey={rewardSummary.membershipTier.key}
          name={rewardSummary.membershipTier.name}
          size="md"
        />
      ) : trailPointsEligible && rewardSummary ? (
        <button
          type="button"
          onClick={() => setShowPointsPath(true)}
          className="text-xs font-semibold text-emerald-600"
        >
          {rewardSummary.points.toLocaleString()} trail points
        </button>
      ) : null}
    </div>
  );

  return (
    <ConsumerShell
      layout="stack"
      title="Profile"
      showJourney={false}
      suppressMobileHeader
    >
      {error && !loading && (
        <ConsumerErrorCard message={error} onRetry={() => void reload()} className="mb-3" />
      )}

      <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
        <div className="space-y-3 pb-nav-safe animate-fade-up">
          <ProfileHeroSection
            displayName={displayName}
            roleLabel={roleLabel}
            avatarUrl={avatarUrl}
            completionPercent={completion.percent}
            shareTitle={`${displayName} on UAE Trail`}
            shareText={shareText}
            sharePath={sharePath}
            shareReady={shareReady}
            showCompletionBadge={!loading}
            onEditAvatar={openAvatarEdit}
            onEditProfile={openEdit}
            onViewProfile={openPublicProfile}
            memberSinceLabel={memberSinceLabel}
            visibilityLabel={profileVisibilityLabel(visibility)}
            extra={heroExtra}
          />

          <ProfileBioCard
            bio={profile.bio}
            canEdit
            onUpdated={(bio) => setProfile((prev) => ({ ...prev, bio }))}
          />

          <ProfileLanguagesCard
            languages={profile.languages ?? null}
            canEdit
            onUpdated={(languages) => setProfile((prev) => ({ ...prev, languages }))}
          />

          <ProfileUpNextStrip plans={upcomingPlans} loading={loading} />

          <ProfileHubMenu
            buddyBadge={buddyBadge}
            showHosting={isActivityHost}
            trailPointsEligible={trailPointsEligible}
          />
        </div>
      </PullToRefresh>

      {rewardSummary && trailPointsEligible && (
        <TrailPointsPathSheet
          open={showPointsPath}
          onClose={() => setShowPointsPath(false)}
          summary={rewardSummary}
        />
      )}

      <AccountAvatarModal
        open={showAvatarEdit}
        onClose={() => setShowAvatarEdit(false)}
        avatarUrl={avatarUrl}
        displayName={displayName}
        saving={avatarSaving}
        message={avatarMessage}
        onSave={saveAvatar}
      />
    </ConsumerShell>
  );
};
