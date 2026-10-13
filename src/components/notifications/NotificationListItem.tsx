import type { NotificationDTO } from '@uaetrail/shared-types';
import { notificationReasonLine } from '../../utils/notificationDisplay';
import { notificationRowSurfaceClass } from '../../utils/notificationCategories';

type NotificationListItemProps = {
  notif: NotificationDTO;
  onClick: () => void;
  compact?: boolean;
  showTimestamp?: boolean;
};

export const NotificationListItem = ({
  notif,
  onClick,
  compact = false,
  showTimestamp = true,
}: NotificationListItemProps) => {
  const reasonLine = notificationReasonLine(notif);
  const padding = compact ? 'px-3 py-2.5' : 'px-4 py-3';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border ${padding} ${notificationRowSurfaceClass(
        notif.isRead
      )} hover:brightness-[0.98]`}
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
