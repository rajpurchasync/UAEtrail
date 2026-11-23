import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { NotificationDTO } from '@uaetrail/shared-types';
import { Bell, ChevronRight } from 'lucide-react';
import {
  activityDetailInvitePath,
  GROUPS_PATH,
  PROFILE_BADGES_PATH,
  planHubPath,
} from '../../config/routingCatalog';
import { acceptMeGroupInviteByToken } from '../../hooks/notificationInboxApi';
import { useMeNotificationsInbox } from '../../hooks/useMeNotificationsInbox';
import { ConsumerErrorCard } from '../mobile/ConsumerFeedback';
import { NotificationInboxFilters } from './NotificationInboxFilters';
import { NotificationListItem } from './NotificationListItem';
import { inferNotificationPath } from '../../utils/notificationRouting';
import { useAuth } from '../../context/AuthContext';
import { notificationKind } from '../../utils/notificationCategories';
import { matchesNotificationSearch } from '../../utils/notificationSearch';
import {
  inferNotificationTopic,
  matchesNotificationTopic,
  NOTIFICATION_TOPIC_OPTIONS,
  type NotificationTopic,
} from '../../utils/notificationTopics';

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

const isFriendInviteNotification = (notif: NotificationDTO): boolean => {
  const kind = notificationKind(notif);
  return kind === 'connection_friend_request' || kind === 'connection_friend_accepted' || kind === 'group_invite';
};

const SETTINGS_CARD =
  'overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm md:rounded-xl';
const SECTION_HEADER =
  'flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/80 bg-neutral-50/60 px-4 py-3';

const secondaryActionClass =
  'inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-800';

export const NotificationHistoryPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topicFilter, setTopicFilter] = useState<NotificationTopic>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isSearchActive = searchQuery.trim().length > 0;

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
    reload,
  } = useMeNotificationsInbox(user?.id, user?.role !== 'platform_admin');

  const topicCounts = useMemo(() => {
    const counts: Partial<Record<NotificationTopic, number>> = { all: notifications.length };
    for (const notif of notifications) {
      const topic = inferNotificationTopic(notif);
      counts[topic] = (counts[topic] ?? 0) + 1;
    }
    return counts;
  }, [notifications]);

  const mainList = useMemo(
    () => notifications.filter((notif) => matchesNotificationTopic(notif, topicFilter)),
    [notifications, topicFilter]
  );

  const searchResults = useMemo(() => {
    if (!isSearchActive) return [];
    return notifications
      .filter((notif) => matchesNotificationSearch(notif, searchQuery))
      .filter((notif) => matchesNotificationTopic(notif, topicFilter));
  }, [notifications, searchQuery, isSearchActive, topicFilter]);

  const listToRender = isSearchActive ? searchResults : mainList;

  const openNotification = async (notif: NotificationDTO) => {
    if (!notif.isRead) await markRead(notif.id);
    navigate(inferNotificationPath(notif));
  };

  const showEmpty = !loading && notifications.length === 0;
  const showFilteredEmpty = !loading && notifications.length > 0 && listToRender.length === 0;
  const activeTopicLabel =
    NOTIFICATION_TOPIC_OPTIONS.find((option) => option.id === topicFilter)?.label ?? 'All';

  return (
    <div className="space-y-4">
      {error ? <ConsumerErrorCard message={error} onRetry={() => void reload()} /> : null}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-12" role="status" aria-live="polite">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" aria-hidden />
          <p className="text-sm font-medium text-neutral-600">Loading notifications</p>
        </div>
      ) : showEmpty ? (
        <div className={`${SETTINGS_CARD} px-4 py-12 text-center md:px-6`}>
          <Bell className="mx-auto mb-3 h-10 w-10 text-neutral-300" aria-hidden />
          <p className="font-medium text-neutral-700">No notifications yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            When something needs your attention, it will show up here.
          </p>
        </div>
      ) : (
        <>
          <section className={SETTINGS_CARD} aria-label="Filter notifications">
            <div className={`${SECTION_HEADER} hidden md:flex`}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Search & topics</p>
            </div>
            <div className="p-3 md:p-4">
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
                  className="mt-3 text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700 md:hidden"
                >
                  Mark all as read
                </button>
              ) : null}
            </div>
          </section>

          <section className={SETTINGS_CARD} aria-label="Notification inbox">
            <div className={SECTION_HEADER}>
              <h2 className="text-sm font-semibold text-neutral-900 md:text-[15px]">
                {isSearchActive
                  ? `Search results${listToRender.length > 0 ? ` (${listToRender.length})` : ''}`
                  : 'Inbox'}
                {!isSearchActive && topicFilter !== 'all' ? (
                  <span className="font-medium text-neutral-500"> · {activeTopicLabel}</span>
                ) : null}
              </h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 ? (
                  <span className="hidden shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white md:inline-flex">
                    {unreadCount > 99 ? '99+' : unreadCount} unread
                  </span>
                ) : null}
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="hidden text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-800 md:inline-flex"
                  >
                    Mark all as read
                  </button>
                ) : null}
              </div>
            </div>

            {showFilteredEmpty ? (
              <p className="px-4 py-10 text-center text-sm text-neutral-500">
                {isSearchActive
                  ? 'No notifications match your search — try another keyword or clear filters.'
                  : topicFilter !== 'all'
                    ? 'No notifications in this topic yet.'
                    : 'Nothing in your inbox yet.'}
              </p>
            ) : (
              <div className="max-md:space-y-2 md:divide-y md:divide-neutral-200/80">
                {listToRender.map((notif) => {
                  const isBadge = isBadgeNotification(notif);
                  const wishlistPath = wishlistMatchPathFromMeta(notif);
                  const activityInviteId = activityJoinInviteIdFromMeta(notif);
                  const inviteToken = inviteTokenFromMeta(notif);
                  const showFriendActions = isFriendInviteNotification(notif) && inviteToken;

                  const rowActions = (
                    <>
                      {wishlistPath ? (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-3 max-md:pl-2">
                          <Link
                            to={wishlistPath}
                            onClick={() => !notif.isRead && markRead(notif.id)}
                            className={secondaryActionClass}
                          >
                            View on map
                            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                          <Link
                            to={planHubPath({ layer: 'places' })}
                            className="text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-800"
                          >
                            Saved map
                          </Link>
                        </div>
                      ) : null}
                      {isBadge ? (
                        <div className="px-4 pb-3 max-md:pl-2">
                          <Link
                            to={PROFILE_BADGES_PATH}
                            onClick={() => !notif.isRead && markRead(notif.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 transition-colors hover:text-amber-900"
                          >
                            View badges
                            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                        </div>
                      ) : null}
                      {activityInviteId ? (
                        <div className="px-4 pb-3 max-md:pl-2">
                          <Link
                            to={activityDetailInvitePath(activityInviteId)}
                            onClick={() => !notif.isRead && markRead(notif.id)}
                            className={secondaryActionClass}
                          >
                            View outing and join
                            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                        </div>
                      ) : null}
                      {showFriendActions ? (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-3 max-md:pl-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!inviteToken) return;
                              await acceptMeGroupInviteByToken(inviteToken).catch(() => undefined);
                              await markRead(notif.id);
                              await reload();
                            }}
                            className={secondaryActionClass}
                          >
                            Accept invite
                            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <Link
                            to={GROUPS_PATH}
                            className="text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-800"
                          >
                            View groups
                          </Link>
                        </div>
                      ) : null}
                    </>
                  );

                  return (
                    <div key={notif.id} className="max-md:space-y-0">
                      <div className="max-md:hidden">
                        <NotificationListItem
                          notif={notif}
                          onClick={() => void openNotification(notif)}
                          compact={false}
                          variant="grouped"
                        />
                        {rowActions}
                      </div>
                      <div className="md:hidden">
                        <NotificationListItem
                          notif={notif}
                          onClick={() => void openNotification(notif)}
                          compact={false}
                          variant="card"
                        />
                        {rowActions}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
