import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/index';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { ConsumerErrorCard } from '../components/mobile/ConsumerFeedback';
import { AccountAvatarModal } from '../components/account';
import { useParticipantHubData } from '../hooks/useParticipantHubData';
import { useHostStatus } from '../hooks/useHostStatus';
import type { MemberProfileStatsDTO, MemberProfileViewStatsDTO } from '@uaetrail/shared-types';
import { useMemberGoals } from '../hooks/useMemberGoals';
import { ProfileConsumerHub } from '../components/profile/ProfileConsumerHub';
import { buildProfileCompletion } from '../utils/profileCompletion';
import { resolveProfileSharePath, resolveProfileShareText } from '../utils/profileShare';
import { USER_CITY_LABELS } from '../constants/userProfileOptions';
import { formatMemberJoinedLabel } from '../utils/formatMemberSince';
import { profileVisibilityLabel } from '../utils/profileVisibilityLabel';
import { memberProfileRoleLabel } from '../member/memberProfileRoleLabel';
import { resolveProfileHostKind } from '../utils/profileRoleLabel';
import { PageMeta } from '../components/seo/PageMeta';
import {
  EXPLORE_MAP_PATH,
  memberProfilePath,
  tripsCompletedPath,
  tripsPlansPath,
} from '../config/routingCatalog';

export const Profile = () => {
  const { user, refreshUser, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, setProfile, incomingBuddyRequests, loading, error, reload } = useParticipantHubData();

  const {
    ownedProfiles,
    canAccessHostConsole,
    profileRoleLabel: profileRoleKey,
    isCommunityHost: gateCommunityHost,
    hostTiers,
    loading: hostGateLoading,
    refresh: refreshHostGate,
  } = useHostStatus({ enabled: Boolean(user) });

  const [profileViewStats, setProfileViewStats] = useState<MemberProfileViewStatsDTO | null>(null);

  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'group_members' | 'private'>('public');
  const { goals, reload: reloadGoals } = useMemberGoals(Boolean(user));
  const [hubStats, setHubStats] = useState<MemberProfileStatsDTO | null>(null);
  const [badgesEarnedCount, setBadgesEarnedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    void api.getMeProfile().then((profileRes) => {
      setMemberSince(profileRes.data.memberSince ?? null);
      setVisibility(profileRes.data.profileVisibility ?? 'public');
    }).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    reloadGoals();
    void api.getMeProfileStats().then((res) => setHubStats(res.data)).catch(() => undefined);
    if (hostTiers.professional || hostTiers.business) {
      void api.getMeProfileViewStats().then((res) => setProfileViewStats(res.data)).catch(() => undefined);
    } else {
      setProfileViewStats(null);
    }
    void api
      .getMemberBadges()
      .then((res) => setBadgesEarnedCount(res.data.filter((b) => b.earned).length))
      .catch(() => undefined);
  }, [user, hostTiers.professional, hostTiers.business]);

  useEffect(() => {
    const state = location.state as { openEdit?: boolean } | null;
    if (!state?.openEdit) return;
    navigate('/profile/edit', { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const hostProfileKind = useMemo(() => resolveProfileHostKind(ownedProfiles), [ownedProfiles]);
  const isActivityHost =
    canAccessHostConsole && hostProfileKind !== 'shop' && (gateCommunityHost || (hubStats?.isCommunityHost ?? false));
  const displayName = profile.displayName || user!.displayName || 'Explorer';
  const roleLabel = memberProfileRoleLabel(profileRoleKey);
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
        fallbackPath: user?.id ? (memberProfilePath(user.id) ?? EXPLORE_MAP_PATH) : EXPLORE_MAP_PATH,
      }),
    [ownedProfiles, user?.id]
  );
  const shareText = resolveProfileShareText(displayName, ownedProfiles);
  const shareReady = !hostGateLoading || ownedProfiles.length > 0;

  const buddyBadge = incomingBuddyRequests.length > 0 ? incomingBuddyRequests.length : undefined;

  const profileHubStats = useMemo(() => {
    const followerCount = hubStats?.followerCount ?? 0;
    const joinedCount = hubStats?.joinedCount ?? 0;
    const hostedCount = hubStats?.hostedCount ?? 0;
    const showHosted = isActivityHost || hostedCount > 0;

    const stats = [
      {
        key: 'followers',
        label: 'Followed by',
        value: followerCount,
      },
      {
        key: 'joined',
        label: 'Joined',
        value: joinedCount,
        to: tripsCompletedPath(),
      },
    ];

    if (showHosted) {
      stats.push({
        key: 'hosted',
        label: 'Hosted',
        value: hostedCount,
        to: tripsPlansPath('hosted'),
      });
    }

    if (profileViewStats) {
      stats.push({
        key: 'profile-views',
        label: 'Profile views (30d)',
        value: profileViewStats.totalViews,
      });
    }

    return stats;
  }, [hubStats, isActivityHost, profileViewStats]);

  const openPublicProfile = useCallback(() => {
    if (!user?.id) return;
    navigate(`/member/${user.id}?view=public`);
  }, [navigate, user?.id]);

  const openEdit = useCallback(() => {
    navigate('/profile/edit');
  }, [navigate]);

  const openAvatarEdit = useCallback(() => {
    setAvatarMessage(null);
    setShowAvatarEdit(true);
  }, []);

  const handleCompleteProfile = useCallback(() => {
    const next = completion.items.find((item) => !item.done);
    if (!next) {
      openEdit();
      return;
    }
    if (next.action === 'avatar') {
      openAvatarEdit();
      return;
    }
    openEdit();
  }, [completion.items, openEdit, openAvatarEdit]);

  const handleRefresh = useCallback(async () => {
    await reload();
    if (!user) return;
    void api.getMeProfile().then((profileRes) => {
      setMemberSince(profileRes.data.memberSince ?? null);
      setVisibility(profileRes.data.profileVisibility ?? 'public');
    });
    reloadGoals();
    void api.getMeProfileStats().then((res) => setHubStats(res.data)).catch(() => undefined);
    void api
      .getMemberBadges()
      .then((res) => setBadgesEarnedCount(res.data.filter((b) => b.earned).length))
      .catch(() => undefined);
    void refreshHostGate();
  }, [reload, user, refreshHostGate, reloadGoals]);

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

  return (
    <>
      <PageMeta title="Profile" noIndex />

      <ConsumerShell layout="tab" title="Profile" suppressMobileHeader maxWidth="4xl">
        {error && !loading ? (
          <ConsumerErrorCard message={error} onRetry={() => void reload()} />
        ) : null}

        <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
          <ProfileConsumerHub
            displayName={displayName}
            roleLabel={roleLabel}
            avatarUrl={avatarUrl}
            completionPercent={completion.percent}
            completionItems={completion.items}
            onCompleteProfile={handleCompleteProfile}
            shareTitle={`${displayName} on UAE Trail`}
            shareText={shareText}
            sharePath={sharePath}
            shareReady={shareReady}
            onEditAvatar={openAvatarEdit}
            onEditProfile={openEdit}
            onViewProfile={openPublicProfile}
            memberSinceLabel={memberSinceLabel}
            visibilityLabel={profileVisibilityLabel(visibility)}
            cityLabel={profileCityLabel}
            hubStats={profileHubStats}
            goalsCount={goals.length}
            badgesEarnedCount={badgesEarnedCount}
            buddyBadge={buddyBadge}
            showHosting={isActivityHost}
            onSignOut={() => void signOut()}
          />
        </PullToRefresh>
      </ConsumerShell>

      <AccountAvatarModal
        open={showAvatarEdit}
        onClose={() => setShowAvatarEdit(false)}
        avatarUrl={avatarUrl}
        displayName={displayName}
        saving={avatarSaving}
        message={avatarMessage}
        onSave={saveAvatar}
      />
    </>
  );
};
