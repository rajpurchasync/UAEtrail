import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAsyncEffect } from '../hooks/useSafeAsyncEffect';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  fetchMemberBadges,
  fetchMeProfile,
  fetchMeProfileStats,
  fetchMeProfileViewStats,
  updateMeProfile,
} from '../hooks/memberProfileApi';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { ConsumerErrorCard } from '../components/mobile/ConsumerFeedback';
import { AccountAvatarModal } from '../components/account';
import { useParticipantHubData } from '../hooks/useParticipantHubData';
import { useMemberStatus } from '../hooks/useMemberStatus';
import type { MemberProfileStatsDTO, MemberProfileViewStatsDTO } from '@uaetrail/shared-types';
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
  memberProfilePath,
  profileHistoryCompletedPath,
  planHostedSchedulePath,
} from '../config/routingCatalog';

export const Profile = () => {
  const { user, refreshUser, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  const [profileViewStats, setProfileViewStats] = useState<MemberProfileViewStatsDTO | null>(null);

  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'group_members' | 'private'>('public');
  const { goals, reload: reloadGoals } = useMemberGoals(Boolean(user));
  const [hubStats, setHubStats] = useState<MemberProfileStatsDTO | null>(null);
  const [badgesEarnedCount, setBadgesEarnedCount] = useState(0);

  useSafeAsyncEffect(async (isActive) => {
    if (!user) return;
    try {
      const me = await fetchMeProfile();
      if (isActive()) {
        setMemberSince(me.memberSince ?? null);
        setVisibility(me.profileVisibility ?? 'public');
      }
    } catch {
      // keep prior member-since / visibility
    }
  }, [user]);

  useSafeAsyncEffect(
    async (isActive) => {
      if (!user) return;
      reloadGoals();
      try {
        const [stats, badges] = await Promise.all([fetchMeProfileStats(), fetchMemberBadges()]);
        if (isActive()) {
          setHubStats(stats);
          setBadgesEarnedCount(badges.filter((badge) => badge.earned).length);
        }
        if (hostTiers.professional || hostTiers.business) {
          const viewStats = await fetchMeProfileViewStats();
          if (isActive()) {
            setProfileViewStats(viewStats);
          }
        } else if (isActive()) {
          setProfileViewStats(null);
        }
      } catch {
        // keep prior hub stats / badges
      }
    },
    [user, hostTiers.professional, hostTiers.business, reloadGoals]
  );

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
        to: profileHistoryCompletedPath(),
      },
    ];

    if (showHosted) {
      stats.push({
        key: 'hosted',
        label: 'Organized',
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
    try {
      const [me, stats, badges] = await Promise.all([
        fetchMeProfile(),
        fetchMeProfileStats(),
        fetchMemberBadges(),
      ]);
      setMemberSince(me.memberSince ?? null);
      setVisibility(me.profileVisibility ?? 'public');
      setHubStats(stats);
      setBadgesEarnedCount(badges.filter((badge) => badge.earned).length);
      if (hostTiers.professional || hostTiers.business) {
        setProfileViewStats(await fetchMeProfileViewStats());
      } else {
        setProfileViewStats(null);
      }
    } catch {
      // partial refresh failure — hub query reload still applied
    }
    reloadGoals();
    await refreshHostGate();
  }, [reload, user, refreshHostGate, reloadGoals, hostTiers.professional, hostTiers.business]);

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
