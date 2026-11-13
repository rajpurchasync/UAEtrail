import type { NotificationDTO } from '@uaetrail/shared-types';
import { notificationReasonLine } from '../../utils/notificationDisplay';
import { notificationRowSurfaceClass } from '../../utils/notificationCategories';

type NotificationListItemProps = {
  notif: NotificationDTO;
  onClick: () => void;
  compact?: boolean;
  showTimestamp?: boolean;
  /** Stacked rows inside a bordered settings card (desktop inbox). */
  variant?: 'card' | 'grouped';
};

export const NotificationListItem = ({
  notif,
  onClick,
  compact = false,
  showTimestamp = true,
  variant = 'card',
}: NotificationListItemProps) => {
  const reasonLine = notificationReasonLine(notif);
  const grouped = variant === 'grouped';
  const padding = compact ? 'px-3 py-2.5' : grouped ? 'px-4 py-3.5' : 'px-4 py-3';
  const shape = grouped ? 'rounded-none border-0' : 'rounded-xl border';
  const surface = grouped
    ? `${notif.isRead ? 'bg-transparent hover:bg-neutral-50' : 'bg-emerald-50/50 hover:bg-emerald-50/70'} transition-colors`
    : `${notificationRowSurfaceClass(notif.isRead)} hover:brightness-[0.98]`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left ${shape} ${padding} ${surface}`}
    >
      <p className={`font-semibold text-neutral-900 line-clamp-2 ${compact ? 'text-sm' : 'text-[15px]'}`}>
        {notif.title}
      </p>
      <p className={`text-neutral-600 mt-0.5 line-clamp-3 ${compact ? 'text-xs' : 'text-sm'}`}>
        {notif.body}
      </p>
      {reasonLine ? (
        <p className={`font-medium text-neutral-700 mt-1 line-clamp-2 ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {reasonLine}
        </p>
      ) : null}
      {showTimestamp ? (
        <p className="text-[11px] text-neutral-400 mt-1.5">
          {new Date(notif.createdAt).toLocaleString()}
        </p>
      ) : null}
    </button>
  );
};
