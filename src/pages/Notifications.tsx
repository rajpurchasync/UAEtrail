import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NotificationDTO } from '@uaetrail/shared-types';
import { Bell, ChevronRight, Sparkles, Trophy } from 'lucide-react';
import { api } from '../api/services';
import { MobileScreen } from '../components/layout/MobileScreen';
import { GlassCard } from '../components/mobile/GlassCard';
import { ShareButton } from '../components/ui/ShareButton';

function rewardMeta(notif: NotificationDTO) {
  const meta = notif.meta as Record<string, unknown> | null | undefined;
  if (!meta || typeof meta !== 'object') return null;
  const kind = meta.kind;
  if (kind !== 'reward' && kind !== 'tier_upgrade') return null;
  return meta;
}

export const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMeNotifications(1);
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await api.markNotificationRead(id).catch(() => undefined);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead().catch(() => undefined);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <MobileScreen title="Notifications" backTo="/profile">
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {unreadCount > 0 && (
        <button
          type="button"
          onClick={markAllRead}
          className="text-sm font-semibold text-emerald-600 mb-4"
        >
          Mark all as read
        </button>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <GlassCard padding className="text-center py-12">
          <Bell className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-600 font-medium">No notifications yet</p>
          <p className="text-sm text-neutral-500 mt-1">Trip updates and request replies appear here.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const meta = rewardMeta(notif);
            const isReward = meta?.kind === 'reward';
            const isTierUpgrade = meta?.kind === 'tier_upgrade';

            return (
              <div
                key={notif.id}
                className={`glass-card-interactive p-4 ${
                  !notif.isRead ? 'ring-2 ring-emerald-500/20' : ''
                } ${isTierUpgrade ? 'bg-gradient-to-br from-amber-50/80 to-orange-50/50' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => !notif.isRead && markRead(notif.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    )}
                    <div className={`flex-1 min-w-0 ${notif.isRead ? 'pl-0' : ''}`}>
                      <div className="flex items-center gap-2">
                        {isReward && <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />}
                        {isTierUpgrade && <Trophy className="w-4 h-4 text-amber-600 shrink-0" />}
                        <p className="font-semibold text-neutral-900 text-[15px]">{notif.title}</p>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{notif.body}</p>
                      {isReward && typeof meta.pointsToNextTier === 'string' && meta.pointsToNextTier && (
                        <p className="text-xs font-medium text-emerald-700 mt-2">{meta.pointsToNextTier}</p>
                      )}
                      <p className="text-xs text-neutral-400 mt-2">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>

                {(isReward || isTierUpgrade) && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100/80 pl-5">
                    <Link
                      to="/my-rewards"
                      onClick={() => !notif.isRead && markRead(notif.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View wallet
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    {isTierUpgrade &&
                      typeof meta.shareTitle === 'string' &&
                      typeof meta.shareText === 'string' && (
                        <ShareButton
                          title={meta.shareTitle}
                          text={meta.shareText}
                          path={typeof meta.sharePath === 'string' ? meta.sharePath : '/trail-points'}
                          iconOnly
                          light
                          className="ml-auto"
                        />
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </MobileScreen>
  );
};
