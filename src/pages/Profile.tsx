import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { NotificationBellPopover } from '../components/layout/NotificationBellPopover';
import {
  AccountActivityPreview,
  AccountAvatarModal,
  AccountEditModal,
  AccountSectionHeader,
  AccountSignOutButton,
  OrganisationHubSections,
} from '../components/account';
import { useParticipantHubData } from '../hooks/useParticipantHubData';
import { useOrganisationHubData } from '../hooks/useOrganisationHubData';
import { useOrganisationGate } from '../hooks/useOrganisationGate';
import { MembershipTierBadge } from '../components/ui/MembershipTierBadge';
import { TrailPointsPathSheet } from '../components/rewards';
import { RewardSummaryDTO } from '@uaetrail/shared-types';
import { ProfileHeroSection } from '../components/profile/ProfileHeroSection';
import { ProfileLanguagesCard } from '../components/profile/ProfileLanguagesCard';
import { ProfileQuickActions, type ProfileQuickAction } from '../components/profile/ProfileQuickActions';
import { ProfileStampsRow } from '../components/profile/ProfileStampsRow';
import { ProfileCompletionCard } from '../components/profile/ProfileCompletionCard';
import { ProfileMapPresenceSection } from '../components/profile/ProfileMapPresenceSection';
import { buildProfileCompletion } from '../utils/profileCompletion';
import { resolveProfileSharePath, resolveProfileShareText } from '../utils/profileShare';
import { buildProfileStamps } from '../utils/profileStamps';
import { USER_CITY_LABELS } from '../constants/userProfileOptions';
import { computeAgeFromDateOfBirth, formatMemberAge } from '../utils/profileAge';
import { resolveProfileOrganisationKind, resolveProfileRoleLabel } from '../utils/profileRoleLabel';
import type { AccountEditSavePayload } from '../components/account/AccountEditModal';
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
    tenantId: hostTenantId,
  } = useOrganisationGate({ enabled: Boolean(user) });

  const host = useOrganisationHubData();

  useEffect(() => {
    if (hostTenantId) {
      host.setTenantId(hostTenantId);
    }
  }, [hostTenantId, host.setTenantId]);

  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
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
    void Promise.all([api.getMeProfile().catch(() => null), api.getMyOrganisationApplication().catch(() => null)]).then(
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
  const hostProfileKind = useMemo(() => resolveProfileOrganisationKind(ownedProfiles), [ownedProfiles]);
  const canHost = isHostRole(user?.role);
  const canEditLanguages = canHost || ownedProfiles.length > 0 || Boolean(memberDetails.languages);
  const isTripHost = canHost && hostProfileKind !== 'shop';
  const messagesPath = canHost ? '/host/messages' : '/messages';
  const activitiesPath = '/activities?tab=joined';
  const displayName = profile.displayName || user!.displayName || 'Explorer';
  const roleLabel = resolveProfileRoleLabel(user?.role, ownedProfiles);
  const avatarUrl = profile.avatarUrl ?? user?.avatarUrl ?? null;

  const profileAge = useMemo(() => {
    const dateOfBirth = profile.dateOfBirth;
    if (dateOfBirth) return computeAgeFromDateOfBirth(dateOfBirth);
    return memberDetails.age;
  }, [memberDetails.age, profile.dateOfBirth]);

  const profileCityLabel = profile.city ? USER_CITY_LABELS[profile.city] : null;

  const completion = useMemo(
    () =>
      buildProfileCompletion({
        displayName,
        avatarUrl,
        bio: profile.bio,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        city: profile.city,
      }),
    [avatarUrl, displayName, profile.bio, profile.city, profile.dateOfBirth, profile.phone]
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
        emoji: '🧭',
        badge:
          (canHost
            ? upcomingTripsCount + host.pendingJoinRequests
            : upcomingTripsCount) || undefined,
        accent: 'bg-emerald-50',
      },
      {
        key: 'messages',
        label: 'Messages',
        to: messagesPath,
        emoji: '💬',
        badge: unreadMessages,
        accent: 'bg-sky-50',
      },
      {
        key: 'buddies',
        label: 'Buddies',
        to: '/buddies',
        emoji: '👥',
        badge: incomingBuddyRequests.length || buddies.length || undefined,
        accent: 'bg-violet-50',
      },
      {
        key: 'groups',
        label: 'Groups',
        to: '/groups',
        emoji: '🫂',
        badge: groups.length,
        accent: 'bg-indigo-50',
      },
    ];

    if (trailPointsEligible) {
      actions.push({
        key: 'rewards',
        label: 'Points',
        to: '/my-rewards',
        emoji: '🏆',
        badge: rewardSummary?.points,
        accent: 'bg-emerald-50',
      });
    }

    actions.push({
      key: 'settings',
      label: 'Settings',
      to: '/profile/settings',
      emoji: '⚙️',
      accent: 'bg-neutral-100',
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

  const saveProfile = async (payload: AccountEditSavePayload) => {
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
      {(profileCityLabel || formatMemberAge(profileAge)) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {profileCityLabel && (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
              📍 {profileCityLabel}
            </span>
          )}
          {formatMemberAge(profileAge) && (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
              {formatMemberAge(profileAge)}
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
          onEditProfile={openEdit}
          onViewProfile={openPublicProfile}
          extra={heroExtra}
        />

        {!loading && profileStamps.length > 0 && (
          <GlassCard padding className="!py-4">
            <ProfileStampsRow stamps={profileStamps} />
          </GlassCard>
        )}

        <ProfileLanguagesCard
          languages={memberDetails.languages}
          canEdit={canEditLanguages}
          onUpdated={(languages) => setMemberDetails((prev) => ({ ...prev, languages }))}
        />

        <ProfileMapPresenceSection />

        {isTripHost && (
          <GlassCard padding className="space-y-3">
            <AccountSectionHeader title="Organising" actionTo="/host/overview" actionLabel="Organisation console" />
            {host.loading ? (
              <div className="flex justify-center py-6">
                <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <OrganisationHubSections
                activitiesCount={host.activities.length}
                pendingJoinRequests={host.pendingJoinRequests}
                upcomingActivitiesCount={host.upcomingActivitiesCount}
                pastActivitiesCount={host.pastActivitiesCount}
                upcomingActivities={host.upcomingActivities}
              />
            )}
          </GlassCard>
        )}

        <ProfileQuickActions actions={quickActions} columns={3} />

        {!loading && completion.percent < 100 && (
          <ProfileCompletionCard
            percent={completion.percent}
            items={completion.items}
            onEditProfile={openEdit}
            onEditAvatar={openAvatarEdit}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AccountActivityPreview
            messagesPath={messagesPath}
            upcomingTrip={upcomingTrip}
            pendingRequests={pendingRequests}
            conversations={conversations}
          />
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
        onSave={saveProfile}
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
