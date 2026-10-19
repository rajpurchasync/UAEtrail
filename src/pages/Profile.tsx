import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { updateMeProfile } from '../hooks/memberProfileApi';
import { useMemberBadges } from '../hooks/useMemberBadges';
import { useMeProfileStats, useMeProfileViewStats } from '../hooks/useMeProfileStats';
import {
  memberBadgesQueryKey,
  meProfileStatsQueryKey,
  meProfileViewStatsQueryKey,
} from '../hooks/clientQueryKeys';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { ConsumerErrorCard } from '../components/mobile/ConsumerFeedback';
import { AccountAvatarModal } from '../components/account';
import { useParticipantHubData } from '../hooks/useParticipantHubData';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { useMemberGoals } from '../hooks/useMemberGoals';
import { ProfileConsumerHub } from '../components/profile/ProfileConsumerHub';
import { buildProfileCompletion } from '../utils/profileCompletion';
import { resolveProfileSharePath, resolveProfileShareText } from '../utils/profileShare';
import { USER_CITY_LABELS, type UserCity } from '../constants/userProfileOptions';
import { formatMemberJoinedLabel } from '../utils/formatMemberSince';
import { profileVisibilityLabel } from '../utils/profileVisibilityLabel';
import { memberProfileRoleLabel } from '../member/memberProfileRoleLabel';
import { resolveProfileHostKind } from '../utils/profileRoleLabel';
import { PageMeta } from '../components/seo/PageMeta';
import {
  EXPLORE_MAP_PATH,
  memberProfileLink,
  memberPublicPreviewLink,
  profileHistoryCompletedPath,
  planHostedSchedulePath,
} from '../config/routingCatalog';

export const Profile = () => {
  const { user, refreshUser, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { profile, setProfile, incomingBuddyRequests, loading, error, reload } = useParticipantHubData();

  const {
    ownedProfiles,
    canAccessPublishingWorkspace,
    profileRoleLabel: profileRoleKey,
    isCommunityHost: gateCommunityHost,
    hostTiers,
    loading: hostGateLoading,
    refresh: refreshHostGate,
  } = useMemberStatus({ enabled: Boolean(user) });

  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const { goals, reload: reloadGoals } = useMemberGoals(Boolean(user));
  const { badges } = useMemberBadges(user?.id);
  const badgesEarnedCount = useMemo(() => badges.filter((badge) => badge.earned).length, [badges]);
  const { data: hubStats } = useMeProfileStats(Boolean(user));
  const showProfileViewStats = hostTiers.professional || hostTiers.business;
  const { data: profileViewStats } = useMeProfileViewStats(Boolean(user) && showProfileViewStats);
  const memberSince = profile.memberSince ?? null;
  const visibility = profile.profileVisibility ?? 'public';

  useEffect(() => {
    const state = location.state as { openEdit?: boolean } | null;
    if (!state?.openEdit) return;
    navigate('/profile/edit', { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const hostProfileKind = useMemo(() => resolveProfileHostKind(ownedProfiles), [ownedProfiles]);
  const isActivityHost =
    canAccessPublishingWorkspace && hostProfileKind !== 'shop' && (gateCommunityHost || (hubStats?.isCommunityHost ?? false));
  const displayName = profile.displayName || user!.displayName || 'Explorer';
  const roleLabel = memberProfileRoleLabel(profileRoleKey);
  const avatarUrl = profile.avatarUrl ?? user?.avatarUrl ?? null;
  const profileCityLabel =
    profile.city && profile.city in USER_CITY_LABELS
      ? USER_CITY_LABELS[profile.city as UserCity]
      : null;
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
        fallbackPath: user?.id ? memberProfileLink(user.id) : EXPLORE_MAP_PATH,
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
        to: profileHistoryCompletedPath(),
      },
    ];

    if (showHosted) {
      stats.push({
        key: 'hosted',
        label: 'Hosted',
        value: hostedCount,
        to: planHostedSchedulePath(),
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
    navigate(memberPublicPreviewLink(user.id));
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
    if (user?.id) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meProfileStatsQueryKey(user.id) }),
        queryClient.invalidateQueries({ queryKey: memberBadgesQueryKey(user.id) }),
        ...(showProfileViewStats
          ? [queryClient.invalidateQueries({ queryKey: meProfileViewStatsQueryKey(user.id) })]
          : []),
      ]);
    }
    reloadGoals();
    await refreshHostGate();
  }, [reload, user?.id, queryClient, refreshHostGate, reloadGoals, showProfileViewStats]);

  const saveAvatar = async (nextAvatarUrl: string) => {
    setAvatarMessage(null);
    setAvatarSaving(true);
    try {
      await updateMeProfile({ avatarUrl: nextAvatarUrl });
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
