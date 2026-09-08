import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  MessageCircle,
  Trophy,
  Users,
} from 'lucide-react';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { NotificationBellPopover } from '../components/layout/NotificationBellPopover';
import {
  AccountActivityPreview,
  AccountAvatarModal,
  AccountEditModal,
} from '../components/account';
import { useParticipantHubData } from '../hooks/useParticipantHubData';
import { useHostHubData } from '../hooks/useHostHubData';
import { useHostGate } from '../hooks/useHostGate';
import { MembershipTierBadge } from '../components/ui/MembershipTierBadge';
import { TrailPointsPathSheet } from '../components/rewards';
import { RewardSummaryDTO } from '@uaetrail/shared-types';
import { ProfileHeroSection } from '../components/profile/ProfileHeroSection';
import { ProfileQuickActions, type ProfileQuickAction } from '../components/profile/ProfileQuickActions';
import { ProfileCompletionCard } from '../components/profile/ProfileCompletionCard';
import { buildProfileCompletion } from '../utils/profileCompletion';
import { resolveProfileSharePath, resolveProfileShareText } from '../utils/profileShare';
import { isHostRole } from '../utils/roles';

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    profile,
    setProfile,
    conversations,
    groups,
    pendingRequests,
    upcomingTripsCount,
    upcomingTrip,
    unreadMessages,
    loading,
    error,
    reload,
  } = useParticipantHubData();

  const {
    ownedProfiles,
    loading: hostGateLoading,
  } = useHostGate({ enabled: Boolean(user) });

  const host = useHostHubData();

  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const [rewardSummary, setRewardSummary] = useState<RewardSummaryDTO | null>(null);
  const [showPointsPath, setShowPointsPath] = useState(false);

  useEffect(() => {
    if (!user) return;
    void api.getMyRewards()
      .then((res) => setRewardSummary(res.data))
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    const state = location.state as { openEdit?: boolean } | null;
    if (!state?.openEdit) return;
    setShowEdit(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const trailPointsEligible = rewardSummary?.trailPointsEligible !== false;
  const canHost = isHostRole(user?.role);
  const messagesPath = canHost ? '/host/messages' : '/messages';
  const activitiesPath = '/activities?tab=joined';
  const displayName = profile.displayName || user!.displayName || 'Explorer';
  const roleLabel = user!.role === 'participant' ? 'Community member' : 'Explorer';
  const avatarUrl = profile.avatarUrl ?? user?.avatarUrl ?? null;

  const completion = useMemo(
    () =>
      buildProfileCompletion({
        displayName,
        avatarUrl,
        bio: profile.bio,
        phone: profile.phone,
      }),
    [avatarUrl, displayName, profile.bio, profile.phone]
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

  const openActivities = useCallback(() => {
    navigate(activitiesPath);
  }, [activitiesPath, navigate]);

  const quickActions = useMemo((): ProfileQuickAction[] => {
    const actions: ProfileQuickAction[] = [
      {
        key: 'activities',
        label: 'Activities',
        onClick: openActivities,
        icon: Compass,
        badge:
          (canHost
            ? upcomingTripsCount + host.pendingJoinRequests
            : upcomingTripsCount) || undefined,
        accent: 'bg-emerald-50 text-emerald-700',
      },
      {
        key: 'messages',
        label: 'Messages',
        to: messagesPath,
        icon: MessageCircle,
        badge: unreadMessages,
        accent: 'bg-sky-50 text-sky-700',
      },
      {
        key: 'groups',
        label: 'Groups',
        to: '/groups',
        icon: Users,
        badge: groups.length,
        accent: 'bg-indigo-50 text-indigo-700',
      },
    ];

    if (trailPointsEligible) {
      actions.splice(3, 0, {
        key: 'rewards',
        label: 'Points',
        to: '/my-rewards',
        icon: Trophy,
        badge: rewardSummary?.points,
        accent: 'bg-emerald-50 text-emerald-700',
      });
    }

    return actions;
  }, [
    canHost,
    groups.length,
    host.pendingJoinRequests,
    messagesPath,
    openActivities,
    rewardSummary?.points,
    trailPointsEligible,
    unreadMessages,
    upcomingTripsCount,
  ]);

  const openSettings = useCallback(() => {
    navigate('/profile/settings');
  }, [navigate]);

  const openEdit = useCallback(() => {
    setShowEdit(true);
  }, []);

  const openAvatarEdit = useCallback(() => {
    setAvatarMessage(null);
    setShowAvatarEdit(true);
  }, []);

  const saveProfile = async (payload: {
    displayName: string;
    bio?: string;
    phone?: string;
  }) => {
    setMessage(null);
    setSaving(true);
    try {
      await api.updateMeProfile(payload);
      await refreshUser();
      setMessage('Profile saved.');
      setShowEdit(false);
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

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
      setAvatarMessage(err instanceof Error ? err.message : 'Failed to save photo');
    } finally {
      setAvatarSaving(false);
    }
  };

  const heroExtra =
    trailPointsEligible && rewardSummary?.membershipTier && rewardSummary.membershipTier.key !== 'free' ? (
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
    ) : null;

  return (
    <ConsumerShell
      layout="stack"
      title="Profile"
      showJourney={false}
      back={{ fallbackTo: '/', label: 'Back' }}
      action={<NotificationBellPopover />}
    >
      {error && !loading && (
        <GlassCard padding className="mb-3 border-red-200/50 bg-red-50/50">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" onClick={reload} className="text-sm font-semibold text-emerald-600 mt-2">
            Retry
          </button>
        </GlassCard>
      )}

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
          onOpenSettings={openSettings}
          extra={heroExtra}
        />

        {!loading && (
          <ProfileCompletionCard
            percent={completion.percent}
            items={completion.items}
            onEditProfile={openEdit}
            onEditAvatar={openAvatarEdit}
          />
        )}

        <ProfileQuickActions actions={quickActions} columns={3} />

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <AccountActivityPreview
              messagesPath={messagesPath}
              upcomingTrip={upcomingTrip}
              pendingRequests={pendingRequests}
              conversations={conversations}
            />
          </>
        )}
      </div>

      {rewardSummary && trailPointsEligible && (
        <TrailPointsPathSheet
          open={showPointsPath}
          onClose={() => setShowPointsPath(false)}
          summary={rewardSummary}
        />
      )}

      <AccountEditModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        profile={profile}
        setProfile={setProfile}
        email={user!.email ?? ''}
        saving={saving}
        message={message}
        pushStatus={pushStatus}
        setPushStatus={setPushStatus}
        onSave={saveProfile}
        onEmailChanged={refreshUser}
      />

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
