import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Compass, Crown, Shield, Sparkles, Trophy } from 'lucide-react';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { PAGE_BANNERS } from '../config/pageBanners';
import { GlassCard } from '../components/mobile/GlassCard';
import {
  AccountActivityPreview,
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

export const Profile = () => {
  const { user, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();
  const {
    profile,
    setProfile,
    conversations,
    pendingRequests,
    upcomingTripsCount,
    upcomingTrip,
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
  const [rewardPoints, setRewardPoints] = useState<number | null>(null);
  const [rewardTier, setRewardTier] = useState<{ key: string; name: string; emoji?: string } | null>(null);
  const [rewardSummary, setRewardSummary] = useState<RewardSummaryDTO | null>(null);
  const [showPointsPath, setShowPointsPath] = useState(false);

  useEffect(() => {
    if (!user) return;
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
        avatarUrl: profile.avatarUrl,
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
    navigate('/');
  };

  const roleLabel = user!.role === 'visitor' ? 'Participant' : 'Explorer';
  const messagesPath = isOrganizer ? '/organizer/messages' : '/messages';
  const displayName = profile.displayName || user!.displayName || 'Explorer';

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
        extra={
          rewardTier && rewardTier.key !== 'free' ? (
            <MembershipTierBadge tierKey={rewardTier.key} name={rewardTier.name} size="md" />
          ) : rewardPoints != null ? (
            <span className="text-xs font-semibold text-gray-500">{rewardPoints.toLocaleString()} pts</span>
          ) : null
        }
      />

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
                  to: '/trips?tab=mine&sub=past',
                  icon: <Compass className="w-4 h-4" />,
                  label: 'Past trips',
                  badge: pastTripsCount || undefined,
                  accent: 'neutral',
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
