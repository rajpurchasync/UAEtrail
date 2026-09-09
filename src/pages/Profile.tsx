import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  Handshake,
  Heart,
  MessageCircle,
  Settings,
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
  AccountSignOutButton,
} from '../components/account';
import { useParticipantHubData } from '../hooks/useParticipantHubData';
import { useHostHubData } from '../hooks/useHostHubData';
import { useHostGate } from '../hooks/useHostGate';
import { MembershipTierBadge } from '../components/ui/MembershipTierBadge';
import { TrailPointsPathSheet } from '../components/rewards';
import { RewardSummaryDTO } from '@uaetrail/shared-types';
import { ProfileHeroSection } from '../components/profile/ProfileHeroSection';
import { ProfileQuickActions, type ProfileQuickAction } from '../components/profile/ProfileQuickActions';
import { ProfileStampsRow } from '../components/profile/ProfileStampsRow';
import { ProfileCompletionCard } from '../components/profile/ProfileCompletionCard';
import { buildProfileCompletion } from '../utils/profileCompletion';
import { resolveProfileSharePath, resolveProfileShareText } from '../utils/profileShare';
import { buildProfileStamps } from '../utils/profileStamps';
import { computeAgeFromDateOfBirth, formatMemberAge } from '../utils/profileAge';
import { resolveProfileHostKind, resolveProfileRoleLabel } from '../utils/profileRoleLabel';
import { attendedTrips } from '../utils/activityHubSections';
import { isHostRole } from '../utils/roles';

export const Profile = () => {
  const { user, refreshUser, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    profile,
    setProfile,
    conversations,
    groups,
    buddies,
    incomingBuddyRequests,
    pendingRequests,
    trips,
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
  const [memberDetails, setMemberDetails] = useState<{ age: number | null; languages: string | null }>({
    age: null,
    languages: null,
  });

  useEffect(() => {
    if (!user) return;
    void Promise.all([api.getMeProfile().catch(() => null), api.getMyHostApplication().catch(() => null)]).then(
      ([profileRes, hostRes]) => {
        const profile = profileRes?.data;
        const meta = hostRes?.data?.metadata;
        const dateOfBirth = profile?.dateOfBirth ?? meta?.dateOfBirth;
        setMemberDetails({
          age: dateOfBirth ? computeAgeFromDateOfBirth(dateOfBirth) : null,
          languages: meta?.languages?.trim() || null,
        });
      }
    );
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
    setShowEdit(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const trailPointsEligible = rewardSummary?.trailPointsEligible !== false;
  const hostProfileKind = useMemo(() => resolveProfileHostKind(ownedProfiles), [ownedProfiles]);
  const canHost = isHostRole(user?.role);
  const isTripHost = canHost && hostProfileKind !== 'shop';
  const messagesPath = canHost ? '/host/messages' : '/messages';
  const activitiesPath = '/activities?tab=joined';
  const displayName = profile.displayName || user!.displayName || 'Explorer';
  const roleLabel = resolveProfileRoleLabel(user?.role, ownedProfiles);
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

  const profileStamps = useMemo(
    () =>
      buildProfileStamps({
        rewardSummary,
        attendedCount: attendedTrips(trips).length,
        hostedCount: host.activities.filter((a) => a.status === 'published').length,
        isHost: isTripHost,
        hostProfileKind,
        isGuideStaff: user?.role === 'tenant_guide',
      }),
    [host.activities, hostProfileKind, isTripHost, rewardSummary, trips, user?.role]
  );

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
        key: 'buddies',
        label: 'Buddies',
        to: '/buddies',
        icon: Handshake,
        badge: incomingBuddyRequests.length || buddies.length || undefined,
        accent: 'bg-violet-50 text-violet-700',
      },
      {
        key: 'groups',
        label: 'Groups',
        to: '/groups',
        icon: Users,
        badge: groups.length,
        accent: 'bg-indigo-50 text-indigo-700',
      },
      {
        key: 'favourites',
        label: 'Saved',
        to: '/favorites',
        icon: Heart,
        accent: 'bg-rose-50 text-rose-600',
      },
    ];

    if (trailPointsEligible) {
      actions.push({
        key: 'rewards',
        label: 'Points',
        to: '/my-rewards',
        icon: Trophy,
        badge: rewardSummary?.points,
        accent: 'bg-emerald-50 text-emerald-700',
      });
    }

    actions.push({
      key: 'settings',
      label: 'Settings',
      to: '/profile/settings',
      icon: Settings,
      accent: 'bg-neutral-100 text-neutral-700',
    });

    return actions;
  }, [
    buddies.length,
    canHost,
    groups.length,
    host.pendingJoinRequests,
    incomingBuddyRequests.length,
    messagesPath,
    openActivities,
    rewardSummary?.points,
    trailPointsEligible,
    unreadMessages,
    upcomingTripsCount,
  ]);

  const openPublicProfile = useCallback(() => {
    if (!user?.id) return;
    navigate(`/member/${user.id}`);
  }, [navigate, user?.id]);

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
      setMessage(err instanceof Error ? err.message : 'Couldn\'t save your profile — try again.');
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
      setAvatarMessage(err instanceof Error ? err.message : 'Couldn\'t save your photo — try again.');
    } finally {
      setAvatarSaving(false);
    }
  };

  const heroExtra = (
    <div className="flex flex-col items-center gap-2">
      {(memberDetails.age != null || memberDetails.languages) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {formatMemberAge(memberDetails.age) && (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
              {formatMemberAge(memberDetails.age)}
            </span>
          )}
          {memberDetails.languages && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              {memberDetails.languages}
            </span>
          )}
        </div>
      )}
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
          onViewProfile={openPublicProfile}
          extra={heroExtra}
        />

        {!loading && profileStamps.length > 0 && (
          <GlassCard padding className="!py-4">
            <ProfileStampsRow stamps={profileStamps} />
          </GlassCard>
        )}

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

        <AccountSignOutButton onSignOut={() => void signOut()} />
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
