import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, Calendar, Compass, Crown, MessageCircle, Plus, ShieldCheck } from 'lucide-react';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { OrganizerShell } from '../components/organizer/OrganizerShell';
import { TenantSwitcher } from '../components/ui';
import { GlassCard } from '../components/mobile/GlassCard';
import {
  AccountEditModal,
  AccountIdentityBar,
  AccountLinkList,
  AccountSignOutButton,
  OrganizerHubSections,
} from '../components/account';
import { useParticipantHubData } from '../hooks/useParticipantHubData';
import { useOrganizerHubData } from '../hooks/useOrganizerHubData';
import { FEATURE_FLAGS } from '../config/platform';
import { invalidateNotificationUnreadBadge } from '../utils/notificationBadge';
import { inferNotificationPath } from '../utils/notificationRouting';

export const OrganizerOverview = () => {
  const { user, signOut, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const participant = useParticipantHubData();
  const organizer = useOrganizerHubData();

  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  const openEdit = useCallback(() => {
    setShowEdit(true);
    setShowDetails(false);
  }, []);

  const save = async (payload: {
    displayName: string;
    bio?: string;
    phone?: string;
    avatarUrl?: string;
  }) => {
    setMessage(null);
    setSaving(true);
    try {
      await api.updateMeProfile({
        displayName: payload.displayName,
        phone: payload.phone,
        bio: payload.bio,
        avatarUrl: payload.avatarUrl,
      });
      await refreshUser();
      setMessage('Profile saved.');
      setShowEdit(false);
      await participant.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const loading = participant.loading || organizer.loading;
  const error = participant.error ?? organizer.error;
  const messagesPath = '/organizer/messages';

  const displayName = participant.profile.displayName || user!.displayName || 'Organizer';

  return (
    <OrganizerShell
      title="Organizer"
      cta={
        <Link to="/organizer/events/new" className="app-cta-sm">
          <Plus className="w-4 h-4" />
          Create
        </Link>
      }
      headerExtra={
        <div className="w-full flex items-center justify-start">
          <TenantSwitcher onChange={(value) => organizer.setTenantId(value)} />
        </div>
      }
    >
      {error && !loading && (
        <GlassCard padding className="mb-3 border-red-200/50 bg-red-50/50">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => {
              participant.reload();
              organizer.reload();
            }}
            className="text-sm font-semibold text-emerald-600 mt-2"
          >
            Retry
          </button>
        </GlassCard>
      )}

      {!organizer.tenantId && (
        <GlassCard padding className="mb-3 border-amber-200/50 bg-amber-50/50">
          <p className="text-sm text-amber-800">Select an organization above to load your events.</p>
        </GlassCard>
      )}

      <AccountIdentityBar
        displayName={displayName}
        email={participant.profile.email || user!.email || ''}
        avatarUrl={participant.profile.avatarUrl}
        roleLabel="Organizer"
        bio={participant.profile.bio}
        phone={participant.profile.phone}
        expanded={showDetails}
        onToggle={() => setShowDetails((open) => !open)}
        onEdit={openEdit}
        onAvatarClick={() => setShowNotifPopover((open) => !open)}
        extra={
          participant.unreadNotifications > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5">
              <Bell className="w-3 h-3" />
              {participant.unreadNotifications}
            </span>
          ) : null
        }
      />

      {showNotifPopover && (
        <GlassCard padding className="mb-3 border border-emerald-100/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-semibold text-neutral-900">Notifications</p>
            {participant.unreadNotifications > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await api.markAllNotificationsRead();
                  setShowNotifPopover(false);
                  await participant.reload();
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
          {participant.notifications.length === 0 ? (
            <p className="text-xs text-neutral-600">No notifications yet.</p>
          ) : (
            <div className="space-y-2">
              {participant.notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={async () => {
                    if (!notif.isRead) {
                      await api.markNotificationRead(notif.id).catch(() => undefined);
                      if (user?.id) {
                        void invalidateNotificationUnreadBadge(queryClient, user.id);
                      }
                    }
                    setShowNotifPopover(false);
                    await participant.reload();
                    navigate(inferNotificationPath(notif));
                  }}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                    notif.isRead
                      ? 'border-neutral-100 bg-white hover:bg-neutral-50'
                      : 'border-emerald-100 bg-emerald-50/60 hover:bg-emerald-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-neutral-900 line-clamp-1">{notif.title}</p>
                  <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">{notif.body}</p>
                </button>
              ))}
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
            <OrganizerHubSections
              eventsCount={organizer.events.length}
              pendingJoinRequests={organizer.pendingJoinRequests}
              upcomingEventsCount={organizer.upcomingEventsCount}
              pastEventsCount={organizer.pastEventsCount}
              upcomingEvents={organizer.upcomingEvents}
            />

            <AccountLinkList
              items={[
                {
                  to: '/trips?tab=mine',
                  icon: <Calendar className="w-4 h-4" />,
                  label: 'My trips as participant',
                  badge: participant.upcomingTripsCount || undefined,
                  accent: 'neutral',
                },
                {
                  to: messagesPath,
                  icon: <MessageCircle className="w-4 h-4" />,
                  label: 'Messages',
                  badge: participant.unreadMessages || undefined,
                  accent: 'neutral',
                },
                {
                  to: '/',
                  icon: <Compass className="w-4 h-4" />,
                  label: 'Explore',
                  accent: 'neutral',
                },
                {
                  to: '/organizer/security-privacy',
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
              ]}
            />
          </>
        )}
      </div>

      <AccountSignOutButton onSignOut={handleSignOut} />

      <AccountEditModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        profile={participant.profile}
        setProfile={participant.setProfile}
        email={user!.email ?? ''}
        saving={saving}
        message={message}
        pushStatus={pushStatus}
        setPushStatus={setPushStatus}
        onSave={save}
        onEmailChanged={refreshUser}
      />
    </OrganizerShell>
  );
};
