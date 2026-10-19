import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, Calendar, Compass, Crown, MessageCircle, Plus, ShieldCheck } from 'lucide-react';
import { updateMeProfile } from '../../hooks/memberProfileApi';
import {
  markAllMeNotificationsRead,
  markNotificationReadById,
} from '../../hooks/notificationInboxApi';
import { useAuth } from '../../context/AuthContext';
import { ConsoleHubSections, ConsoleShell, useConsoleHubData } from '../../console';
import { TenantSwitcher } from '../../components/ui';
import { GlassCard } from '../../components/mobile/GlassCard';
import {
  AccountEditModal,
  AccountIdentityBar,
  AccountLinkList,
  AccountSignOutButton,
} from '../../components/account';
import type { AccountEditSavePayload } from '../../components/account/AccountEditModal';
import { useParticipantHubData } from '../../hooks/useParticipantHubData';
import { FEATURE_FLAGS } from '../../config/platform';
import {
  EXPLORE_MAP_PATH,
  MESSAGES_PATH,
  PUBLISHING_ACTIVITIES_NEW_PATH,
  PUBLISHING_SECURITY_PRIVACY_PATH,
  PRO_MEMBERSHIP_PATH,
  NOTIFICATIONS_PATH,
  planJoinedSchedulePath,
} from '../../config/routingCatalog';
import { NotificationListItem } from '../../components/notifications/NotificationListItem';
import { invalidateNotificationUnreadBadge } from '../../utils/notificationBadge';
import { inferNotificationPath } from '../../utils/notificationRouting';
import {
  HOST_FALLBACK_DISPLAY_NAME,
  ACTIVITY_HOST_NOUN_TITLE,
  workspaceConsoleLabel,
} from '../../content/workspaceVocabulary';

export const Overview = () => {
  const { user, signOut, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const participant = useParticipantHubData();
  const host = useConsoleHubData();

  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  const openEdit = useCallback(() => {
    setShowEdit(true);
    setShowDetails(false);
  }, []);

  const save = async (payload: AccountEditSavePayload) => {
    setMessage(null);
    setSaving(true);
    try {
      await updateMeProfile(payload);
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

  const loading = participant.loading || host.loading;
  const error = participant.error ?? host.error;
  const messagesPath = MESSAGES_PATH;

  const displayName =
    participant.profile.displayName || user!.displayName || HOST_FALLBACK_DISPLAY_NAME;

  return (
    <ConsoleShell
      title={workspaceConsoleLabel()}
      cta={
        <Link to={PUBLISHING_ACTIVITIES_NEW_PATH} className="app-cta-sm">
          <Plus className="w-4 h-4" />
          Add activity
        </Link>
      }
      headerExtra={
        <div className="w-full flex items-center justify-start">
          <TenantSwitcher onChange={(value) => host.setTenantId(value)} />
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
              host.reload();
            }}
            className="text-sm font-semibold text-emerald-600 mt-2"
          >
            Retry
          </button>
        </GlassCard>
      )}

      {!host.tenantId && (
        <GlassCard padding className="mb-3 border-amber-200/50 bg-amber-50/50">
          <p className="text-sm text-amber-800">Select a publishing profile above to load your activities.</p>
        </GlassCard>
      )}

      <AccountIdentityBar
        displayName={displayName}
        email={participant.profile.email || user!.email || ''}
        avatarUrl={participant.profile.avatarUrl}
        roleLabel={ACTIVITY_HOST_NOUN_TITLE}
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
        <GlassCard padding className="mb-3 border border-emerald-100/80 bg-emerald-50/20">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-semibold text-neutral-900">Unread messages &amp; chat</p>
            <div className="flex items-center gap-2">
              <Link
                to={NOTIFICATIONS_PATH}
                onClick={() => setShowNotifPopover(false)}
                className="text-xs font-semibold text-emerald-700"
              >
                View all
              </Link>
              {participant.unreadNotifications > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    await markAllMeNotificationsRead();
                    setShowNotifPopover(false);
                    await participant.reload();
                    if (user?.id) {
                      void invalidateNotificationUnreadBadge(queryClient, user.id);
                    }
                  }}
                  className="text-xs font-semibold text-neutral-600"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
          {participant.notifications.length === 0 ? (
            <p className="text-xs text-neutral-600">No unread messages or chat alerts.</p>
          ) : (
            <div className="space-y-2">
              {participant.notifications.map((notif) => (
                <NotificationListItem
                  key={notif.id}
                  notif={notif}
                  compact
                  showTimestamp={false}
                  onClick={async () => {
                    if (!notif.isRead) {
                      await markNotificationReadById(notif.id).catch(() => undefined);
                      if (user?.id) {
                        void invalidateNotificationUnreadBadge(queryClient, user.id);
                      }
                    }
                    setShowNotifPopover(false);
                    await participant.reload();
                    navigate(inferNotificationPath(notif));
                  }}
                />
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
            <ConsoleHubSections
              activitiesCount={host.activities.length}
              pendingJoinRequests={host.pendingJoinRequests}
              upcomingActivitiesCount={host.upcomingActivitiesCount}
              pastActivitiesCount={host.pastActivitiesCount}
              upcomingActivities={host.upcomingActivities}
              showConsoleLinks={false}
            />

            <AccountLinkList
              items={[
                {
                  to: planJoinedSchedulePath(),
                  icon: <Calendar className="w-4 h-4" />,
                  label: 'Joined outings (My Plans)',
                  badge: participant.upcomingActivitiesCount || undefined,
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
                  to: EXPLORE_MAP_PATH,
                  icon: <Compass className="w-4 h-4" />,
                  label: 'Explore map',
                  accent: 'neutral',
                },
                {
                  to: PUBLISHING_SECURITY_PRIVACY_PATH,
                  icon: <ShieldCheck className="w-4 h-4" />,
                  label: 'Security & privacy',
                  accent: 'blue' as const,
                },
                ...(FEATURE_FLAGS.membershipEnabled
                  ? [
                      {
                        to: PRO_MEMBERSHIP_PATH,
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
        onSave={save}
      />
    </ConsoleShell>
  );
};
