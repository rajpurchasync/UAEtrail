import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationDTO } from '@uaetrail/shared-types';
import { Bell, ChevronRight } from 'lucide-react';
import {
  activityDetailInvitePath,
  GROUPS_PATH,
  PROFILE_BADGES_PATH,
  tripsPath,
} from '../config/routingCatalog';
import { api } from '../api/index';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { ConsumerErrorCard, ConsumerLoadingSpinner } from '../components/mobile/ConsumerFeedback';
import { PageMeta } from '../components/seo/PageMeta';
import { NotificationInboxFilters } from '../components/notifications/NotificationInboxFilters';
import { NotificationListItem } from '../components/notifications/NotificationListItem';
import { inferNotificationPath } from '../utils/notificationRouting';
import { useAuth } from '../context/AuthContext';
import { invalidateNotificationUnreadBadge } from '../utils/notificationBadge';
import { notificationKind, sortNotificationsNewestFirst } from '../utils/notificationCategories';
import { matchesNotificationSearch } from '../utils/notificationSearch';
import {
  inferNotificationTopic,
  matchesNotificationTopic,
  NOTIFICATION_TOPIC_OPTIONS,
  type NotificationTopic,
} from '../utils/notificationTopics';

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

const isBadgeNotification = (notif: NotificationDTO): boolean => {
  const kind = notificationKind(notif);
  return kind === 'badge' || kind === 'reward' || kind === 'tier_upgrade';
};

const isBuddyInviteNotification = (notif: NotificationDTO): boolean => {
  const kind = notificationKind(notif);
  return kind === 'connection_buddy_request' || kind === 'connection_buddy_accepted' || kind === 'group_invite';
};

export const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicFilter, setTopicFilter] = useState<NotificationTopic>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isSearchActive = searchQuery.trim().length > 0;

  const syncUnreadBadge = () => {
    if (!user?.id) return;
    void invalidateNotificationUnreadBadge(queryClient, user.id);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMeNotifications(1);
      setNotifications(sortNotificationsNewestFirst(res.data));
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

  const sorted = useMemo(() => sortNotificationsNewestFirst(notifications), [notifications]);

  const topicCounts = useMemo(() => {
    const counts: Partial<Record<NotificationTopic, number>> = { all: sorted.length };
    for (const notif of sorted) {
      const topic = inferNotificationTopic(notif);
      counts[topic] = (counts[topic] ?? 0) + 1;
    }
    return counts;
  }, [sorted]);

  const mainList = useMemo(
    () => sorted.filter((notif) => matchesNotificationTopic(notif, topicFilter)),
    [sorted, topicFilter]
  );

  const searchResults = useMemo(() => {
    if (!isSearchActive) return [];
    return sorted
      .filter((notif) => matchesNotificationSearch(notif, searchQuery))
      .filter((notif) => matchesNotificationTopic(notif, topicFilter));
  }, [sorted, searchQuery, isSearchActive, topicFilter]);

  const listToRender = isSearchActive ? searchResults : mainList;

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

  const showEmpty = !loading && notifications.length === 0;
  const showFilteredEmpty = !loading && notifications.length > 0 && listToRender.length === 0;
  const activeTopicLabel =
    NOTIFICATION_TOPIC_OPTIONS.find((option) => option.id === topicFilter)?.label ?? 'All';

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

        {loading ? (
          <ConsumerLoadingSpinner />
        ) : showEmpty ? (
          <GlassCard padding className="text-center py-12">
            <Bell className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600 font-medium">No notifications yet</p>
            <p className="text-sm text-neutral-500 mt-1">
              When something needs your attention, it will show up here.
            </p>
          </GlassCard>
        ) : (
          <>
            <div className="sticky top-0 z-20 -mx-4 px-4 py-3 mb-1 bg-[#eef6f3]/95 backdrop-blur-md border-b border-black/[0.06] md:bg-gray-50/95 md:border-neutral-200/80">
              <NotificationInboxFilters
                topic={topicFilter}
                onTopicChange={setTopicFilter}
                topicCounts={topicCounts}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
              />
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="mt-3 text-sm font-semibold text-emerald-600"
                >
                  Mark all as read
                </button>
              ) : null}
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-bold text-neutral-900">
                {isSearchActive
                  ? `Search results${listToRender.length > 0 ? ` (${listToRender.length})` : ''}`
                  : 'Inbox'}
                {!isSearchActive && topicFilter !== 'all' ? ` · ${activeTopicLabel}` : ''}
              </h2>

              {showFilteredEmpty ? (
                <p className="text-sm text-neutral-500 py-4 text-center">
                  {isSearchActive
                    ? 'No notifications match your search — try another keyword or clear filters.'
                    : topicFilter !== 'all'
                      ? 'No notifications in this topic yet.'
                      : 'Nothing in your inbox yet.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {listToRender.map((notif) => {
                    const isBadge = isBadgeNotification(notif);
                    return (
                      <div key={notif.id} className="space-y-0">
                        <NotificationListItem
                          notif={notif}
                          onClick={() => void openNotification(notif)}
                          compact={false}
                        />

                        {wishlistMatchPathFromMeta(notif) ? (
                          <div className="flex items-center gap-2 pl-2 pb-2">
                            <Link
                              to={wishlistMatchPathFromMeta(notif)!}
                              onClick={() => !notif.isRead && markRead(notif.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
                            >
                              View on map
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                            <Link to={tripsPath({ layer: 'places' })} className="text-xs font-medium text-neutral-600">
                              Saved map
                            </Link>
                          </div>
                        ) : null}

                        {isBadge ? (
                          <div className="pl-2 pb-2">
                            <Link
                              to={PROFILE_BADGES_PATH}
                              onClick={() => !notif.isRead && markRead(notif.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800"
                            >
                              View badges
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        ) : null}

                        {activityJoinInviteIdFromMeta(notif) ? (
                          <div className="pl-2 pb-2">
                            <Link
                              to={activityDetailInvitePath(activityJoinInviteIdFromMeta(notif)!)}
                              onClick={() => !notif.isRead && markRead(notif.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
                            >
                              View outing and join
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        ) : null}

                        {isBuddyInviteNotification(notif) && inviteTokenFromMeta(notif) ? (
                          <div className="flex items-center gap-2 pl-2 pb-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const token = inviteTokenFromMeta(notif);
                                if (!token) return;
                                await api.acceptMeGroupInvite(token).catch(() => undefined);
                                await markRead(notif.id);
                                await load();
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
                            >
                              Accept invite
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <Link to={GROUPS_PATH} className="text-xs font-medium text-neutral-600">
                              View groups
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ConsumerShell>
  );
};
