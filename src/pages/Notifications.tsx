import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationDTO } from '@uaetrail/shared-types';
import { Award, Bell, ChevronRight } from 'lucide-react';
import { activityDetailInvitePath, GROUPS_PATH, PROFILE_BADGES_PATH, tripsPath } from '../config/routingCatalog';
import { api } from '../api/index';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { ConsumerErrorCard, ConsumerLoadingSpinner } from '../components/mobile/ConsumerFeedback';
import { PageMeta } from '../components/seo/PageMeta';
import { inferNotificationPath } from '../utils/notificationRouting';
import { useAuth } from '../context/AuthContext';
import { invalidateNotificationUnreadBadge } from '../utils/notificationBadge';
import { notificationReasonLine } from '../utils/notificationDisplay';

type NotificationSection =
  | 'Activity updates'
  | 'Reminders'
  | 'Messages'
  | 'Group chat'
  | 'Buddy requests'
  | 'Connections'
  | 'Badges'
  | 'Comments approved'
  | 'Comments liked'
  | 'Other';

const sectionOrder: NotificationSection[] = [
  'Activity updates',
  'Reminders',
  'Messages',
  'Group chat',
  'Buddy requests',
  'Connections',
  'Badges',
  'Comments approved',
  'Comments liked',
  'Other'
];

const inferSection = (notif: NotificationDTO): NotificationSection => {
  const meta = notif.meta as Record<string, unknown> | null | undefined;
  const kind = typeof meta?.kind === 'string' ? meta.kind.toLowerCase() : '';
  const text = `${notif.title} ${notif.body}`.toLowerCase();

  if (kind === 'badge' || kind === 'reward' || kind === 'tier_upgrade') return 'Badges';
  if (kind === 'wishlist_match') return 'Activity updates';
  if (kind === 'activity_join_invite') return 'Activity updates';
  if (kind.startsWith('join_request') || kind === 'request_withdrawal') return 'Activity updates';
  if (kind === 'connection_buddy_request' || kind === 'connection_buddy_accepted') return 'Buddy requests';
  if (kind === 'connection_member_followed') return 'Connections';
  if (kind === 'group_invite' || kind === 'group_invite_accepted' || text.includes('group invite')) return 'Group chat';
  if (kind.includes('group_message') || text.includes('new message in')) return 'Group chat';
  if (kind.includes('comment_approved') || text.includes('comment approved')) return 'Comments approved';
  if (kind.includes('comment_liked') || text.includes('comment liked') || text.includes('liked your comment')) {
    return 'Comments liked';
  }
  if (kind.includes('message') || text.includes('message')) return 'Messages';
  if (kind.includes('reminder') || text.includes('reminder')) return 'Reminders';
  if (notif.type === 'activity' || text.includes('request update')) return 'Activity updates';
  return 'Other';
};

const wishlistMatchPathFromMeta = (notif: NotificationDTO): string | null => {
  const meta = notif.meta as Record<string, unknown> | null | undefined;
  if (!meta || meta.kind !== 'wishlist_match') return null;
  return typeof meta.path === 'string' ? meta.path : null;
};

const inviteTokenFromMeta = (notif: NotificationDTO): string | null => {
  const meta = notif.meta as Record<string, unknown> | null | undefined;
  if (!meta || typeof meta.inviteToken !== 'string') return null;
  return meta.inviteToken;
};

const activityJoinInviteIdFromMeta = (notif: NotificationDTO): string | null => {
  const meta = notif.meta as Record<string, unknown> | null | undefined;
  if (!meta || meta.kind !== 'activity_join_invite') return null;
  return typeof meta.activityId === 'string' ? meta.activityId : null;
};

export const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncUnreadBadge = () => {
    if (!user?.id) return;
    void invalidateNotificationUnreadBadge(queryClient, user.id);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMeNotifications(1);
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn\'t load notifications — tap to retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'platform_admin') return;
    void load();
  }, [user?.role]);

  if (user?.role === 'platform_admin') {
    return <Navigate to="/admin/notifications" replace />;
  }

  const markRead = async (id: string) => {
    await api.markNotificationRead(id).catch(() => undefined);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    syncUnreadBadge();
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead().catch(() => undefined);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    syncUnreadBadge();
  };

  const openNotification = async (notif: NotificationDTO) => {
    if (!notif.isRead) await markRead(notif.id);
    navigate(inferNotificationPath(notif));
  };

  return (
    <ConsumerShell
      layout="stack"
      title="Notifications"
      maxWidth="4xl"
      showJourney={false}
      back={{ fallbackTo: '/profile', label: 'Profile' }}
    >
      <PageMeta title="Notifications" noIndex />

      <div className="space-y-4 pb-nav-safe animate-fade-up">
      {error ? <ConsumerErrorCard message={error} onRetry={() => void load()} /> : null}

      {unreadCount > 0 && (
        <button
          type="button"
          onClick={markAllRead}
          className="text-sm font-semibold text-emerald-600"
        >
          Mark all as read
        </button>
      )}

      {loading ? (
        <ConsumerLoadingSpinner />
      ) : notifications.length === 0 ? (
        <GlassCard padding className="text-center py-12">
          <Bell className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-600 font-medium">You&apos;re all caught up</p>
          <p className="text-sm text-neutral-500 mt-1">Activity updates, messages, and request replies appear here.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {sectionOrder.map((section) => {
            const items = notifications.filter((notif) => inferSection(notif) === section);
            if (items.length === 0) return null;

            return (
              <section key={section}>
                <h3 className="text-xs uppercase tracking-wide font-bold text-neutral-600 mb-2">{section}</h3>
                <div className="space-y-2">
                  {items.map((notif) => {
            const reasonLine = notificationReasonLine(notif);
            const isBadge = inferSection(notif) === 'Badges';

            return (
              <div
                key={notif.id}
                className={`glass-card-interactive p-4 ${
                  !notif.isRead ? 'ring-2 ring-emerald-500/20' : isBadge ? 'ring-1 ring-amber-200/80' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => void openNotification(notif)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    {isBadge ? (
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-800">
                        <Award className="h-4 w-4" aria-hidden />
                      </span>
                    ) : !notif.isRead ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    ) : null}
                    <div className={`flex-1 min-w-0 ${notif.isRead ? 'pl-0' : ''}`}>
                      <p className="font-semibold text-neutral-900 text-[15px]">{notif.title}</p>
                      <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{notif.body}</p>
                      {reasonLine && (
                        <p className="text-xs font-medium text-neutral-700 mt-2">{reasonLine}</p>
                      )}
                      <p className="text-xs text-neutral-400 mt-2">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>

                {wishlistMatchPathFromMeta(notif) && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100/80 pl-5">
                    <Link
                      to={wishlistMatchPathFromMeta(notif)!}
                      onClick={() => !notif.isRead && markRead(notif.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View on map
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={tripsPath({ layer: 'places' })}
                      className="text-xs font-medium text-neutral-600"
                    >
                      Saved map
                    </Link>
                  </div>
                )}
                {isBadge && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100/80 pl-5">
                    <Link
                      to={PROFILE_BADGES_PATH}
                      onClick={() => !notif.isRead && markRead(notif.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900"
                    >
                      View badges
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
                {activityJoinInviteIdFromMeta(notif) && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100/80 pl-5">
                    <Link
                      to={activityDetailInvitePath(activityJoinInviteIdFromMeta(notif)!)}
                      onClick={() => !notif.isRead && markRead(notif.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View outing and join
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
                {inferSection(notif) === 'Buddy requests' && inviteTokenFromMeta(notif) && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100/80 pl-5">
                    <button
                      type="button"
                      onClick={async () => {
                        const token = inviteTokenFromMeta(notif);
                        if (!token) return;
                        await api.acceptMeGroupInvite(token).catch(() => undefined);
                        await markRead(notif.id);
                        await load();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Accept invite
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <Link to={GROUPS_PATH} className="text-xs font-medium text-neutral-600">
                      View groups
                    </Link>
                  </div>
                )}
              </div>
            );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
      </div>
    </ConsumerShell>
  );
};
