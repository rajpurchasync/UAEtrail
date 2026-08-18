import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, Briefcase, Compass, Crown, Heart, Shield, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react';
import { api } from '../api/services';
import { setStoredSession } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { PAGE_BANNERS } from '../config/pageBanners';
import { GlassCard } from '../components/mobile/GlassCard';
import {
  AccountActivityPreview,
  AccountGroupsPreview,
  AccountEditModal,
  AccountIdentityBar,
  AccountLinkList,
  AccountSignOutButton,
  AccountStatGrid,
  buildParticipantStats,
} from '../components/account';
import { FEATURE_FLAGS } from '../config/platform';
import { useParticipantHubData } from '../hooks/useParticipantHubData';
import { MembershipTierBadge } from '../components/ui/MembershipTierBadge';
import { ProfileTrailPointsChip, TrailPointsPathSheet } from '../components/rewards';
import { RewardSummaryDTO } from '@uaetrail/shared-types';
import { accountRouteByRole } from '../utils/authRouting';
import { invalidateNotificationUnreadBadge } from '../utils/notificationBadge';
import { inferNotificationPath } from '../utils/notificationRouting';

export const Profile = () => {
  const { user, signOut, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    profile,
    setProfile,
    conversations,
    groups,
    pendingRequests,
    upcomingTripsCount,
    upcomingTrip,
    notifications,
    unreadMessages,
    unreadNotifications,
    pastTripsCount,
    loading,
    error,
    reload,
  } = useParticipantHubData();

  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [savedItemsCount, setSavedItemsCount] = useState(0);
  const [rewardPoints, setRewardPoints] = useState<number | null>(null);
  const [rewardTier, setRewardTier] = useState<{ key: string; name: string; emoji?: string } | null>(null);
  const [rewardSummary, setRewardSummary] = useState<RewardSummaryDTO | null>(null);
  const [showPointsPath, setShowPointsPath] = useState(false);
  const [roleSwitching, setRoleSwitching] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.getMeFavorites()
      .then((res) => {
        setSavedItemsCount(res.data.filter((item) => Boolean(item.locationId) || Boolean(item.productId)).length);
      })
      .catch(() => undefined);

    api.getMyRewards()
      .then((res) => {
        setRewardPoints(res.data.points);
        setRewardTier(res.data.membershipTier);
        setRewardSummary(res.data);
      })
      .catch(() => undefined);
  }, [user]);

  const isOrganizer =
    user?.role === 'tenant_owner' || user?.role === 'tenant_admin' || user?.role === 'tenant_guide';

  const openEdit = useCallback(() => {
    setShowEdit(true);
    setShowDetails(false);
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      await api.updateMeProfile({
        displayName: profile.displayName,
        phone: profile.phone,
        bio: profile.bio,
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
      });
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/signed-out', { replace: true });
  };

  const roleLabel = user!.role === 'visitor' ? 'Participant' : 'Explorer';
  const messagesPath = isOrganizer ? '/organizer/messages' : '/messages';
  const displayName = profile.displayName || user!.displayName || 'Explorer';
  const canSwitchToVisitor =
    user!.role === 'platform_admin' ||
    user!.role === 'merchant_admin' ||
    user!.role === 'tenant_owner' ||
    user!.role === 'tenant_admin' ||
    user!.role === 'tenant_guide';
  const canSwitchBack = user!.role === 'visitor' && Boolean(profile.switchedFromRole);

  const switchRole = async (target: 'visitor' | 'original') => {
    setMessage(null);
    setRoleSwitching(true);
    try {
      const res = await api.switchMeRole(target);
      setStoredSession(res.tokens);
      await refreshUser();
      await reload();
      const nextPath = accountRouteByRole(res.data.role as Parameters<typeof accountRouteByRole>[0]);
      setMessage(target === 'visitor' ? 'Switched to visitor mode.' : 'Restored your original role.');
      navigate(nextPath, { replace: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to switch role');
    } finally {
      setRoleSwitching(false);
    }
  };

  const statItems = buildParticipantStats({
    upcomingTripsCount,
    pendingRequestsCount: pendingRequests.length,
    unreadMessages,
    unreadNotifications,
    messagesPath,
  });

  return (
    <ConsumerShell
      layout="tab"
      title="Profile"
      banner={{ src: PAGE_BANNERS.profile, alt: 'Mountain peaks at dawn' }}
      action={
        rewardSummary ? (
          <ProfileTrailPointsChip summary={rewardSummary} onClick={() => setShowPointsPath(true)} />
        ) : undefined
      }
    >
      {error && !loading && (
        <GlassCard padding className="mb-3 border-red-200/50 bg-red-50/50">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" onClick={reload} className="text-sm font-semibold text-emerald-600 mt-2">
            Retry
          </button>
        </GlassCard>
      )}

      <AccountIdentityBar
        displayName={displayName}
        email={profile.email || user!.email || ''}
        avatarUrl={profile.avatarUrl}
        roleLabel={roleLabel}
        bio={profile.bio}
        phone={profile.phone}
        expanded={showDetails}
        onToggle={() => setShowDetails((open) => !open)}
        onEdit={openEdit}
        onAvatarClick={() => setShowNotifPopover((open) => !open)}
        extra={
          rewardTier && rewardTier.key !== 'free' ? (
            <MembershipTierBadge tierKey={rewardTier.key} name={rewardTier.name} size="md" />
          ) : rewardPoints != null ? (
            <span className="text-xs font-semibold text-gray-500">{rewardPoints.toLocaleString()} pts</span>
          ) : null
        }
      />

      {showNotifPopover && (
        <GlassCard padding className="mb-3 border border-emerald-100/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-semibold text-neutral-900">Notifications</p>
            {unreadNotifications > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await api.markAllNotificationsRead();
                  setShowNotifPopover(false);
                  await reload();
                  if (user?.id) {
                    void invalidateNotificationUnreadBadge(queryClient, user.id);
                  }
                }}
                className="text-xs font-semibold text-emerald-700"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-neutral-600">No notifications yet.</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => {
                    if (!notif.isRead) {
                      void api.markNotificationRead(notif.id).then(() => {
                        if (user?.id) {
                          void invalidateNotificationUnreadBadge(queryClient, user.id);
                        }
                      });
                    }
                    setShowNotifPopover(false);
                    navigate(inferNotificationPath(notif));
                  }}
                  className={`w-full text-left rounded-xl px-3 py-2 border ${
                    notif.isRead ? 'border-neutral-100 bg-white' : 'border-emerald-100 bg-emerald-50/60'
                  }`}
                >
                  <p className="text-sm font-semibold text-neutral-900 line-clamp-1">{notif.title}</p>
                  <p className="text-xs text-neutral-600 line-clamp-2 mt-0.5">{notif.body}</p>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowNotifPopover(false);
                  navigate('/notifications');
                }}
                className="w-full text-xs font-semibold text-emerald-700 text-left px-1"
              >
                See all notifications
              </button>
            </div>
          )}
        </GlassCard>
      )}

      <div className="space-y-3 animate-fade-up">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <AccountStatGrid stats={statItems} />

            <AccountActivityPreview
              messagesPath={messagesPath}
              upcomingTrip={upcomingTrip}
              pendingRequests={pendingRequests}
              conversations={conversations}
            />

            <AccountGroupsPreview groups={groups} loading={loading} />

            <AccountLinkList
              items={[
                {
                  to: '/my-rewards',
                  icon: <Trophy className="w-4 h-4" />,
                  label: 'Trail Points',
                  badge: rewardPoints ?? undefined,
                  accent: 'emerald' as const,
                },
                {
                  to: '/notifications',
                  icon: <Bell className="w-4 h-4" />,
                  label: 'Notifications',
                  badge: unreadNotifications || undefined,
                  accent: 'amber' as const,
                },
                {
                  to: '/groups',
                  icon: <Users className="w-4 h-4" />,
                  label: 'My Groups',
                  badge: groups.length || undefined,
                  accent: 'blue' as const,
                },
                {
                  to: '/favorites',
                  icon: <Heart className="w-4 h-4" />,
                  label: 'Saved items',
                  badge: savedItemsCount || undefined,
                  accent: 'emerald' as const,
                },
                {
                  to: '/trips?tab=mine&sub=past',
                  icon: <Compass className="w-4 h-4" />,
                  label: 'Past trips',
                  badge: pastTripsCount || undefined,
                  accent: 'neutral',
                },
                {
                  to: '/security-privacy',
                  icon: <ShieldCheck className="w-4 h-4" />,
                  label: 'Security & privacy',
                  accent: 'blue' as const,
                },
                ...(FEATURE_FLAGS.membershipEnabled
                  ? [
                      {
                        to: '/membership',
                        icon: <Crown className="w-4 h-4" />,
                        label: 'Membership',
                        accent: 'amber' as const,
                      },
                    ]
                  : []),
                isOrganizer
                  ? {
                      to: '/organizer/overview',
                      icon: <Briefcase className="w-4 h-4" />,
                      label: 'Organizer console',
                    }
                  : user!.role === 'platform_admin'
                    ? {
                        to: '/admin/overview',
                        icon: <Shield className="w-4 h-4" />,
                        label: 'Admin console',
                        accent: 'blue' as const,
                      }
                    : {
                        to: '/become-host',
                        icon: <Sparkles className="w-4 h-4" />,
                        label: 'Become a host',
                        accent: 'amber' as const,
                      },
              ]}
            />

            {(canSwitchToVisitor || canSwitchBack) && (
              <GlassCard padding className="border border-emerald-100/80">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Role mode</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {canSwitchBack
                        ? `You are browsing as visitor. Restore ${profile.switchedFromRole?.replace('_', ' ')} mode anytime.`
                        : 'Switch to visitor mode to book trips and shop as a participant.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={roleSwitching}
                    onClick={() => void switchRole(canSwitchBack ? 'original' : 'visitor')}
                    className="ios-btn bg-emerald-600 text-white min-h-[40px] px-3"
                  >
                    {roleSwitching ? 'Switching…' : canSwitchBack ? 'Restore role' : 'Switch to visitor'}
                  </button>
                </div>
              </GlassCard>
            )}
          </>
        )}
      </div>

      <AccountSignOutButton onSignOut={handleSignOut} />

      {rewardSummary && (
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
        onSubmit={save}
      />
    </ConsumerShell>
  );
};
