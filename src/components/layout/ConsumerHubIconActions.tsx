import { CalendarDays, MessageSquare } from 'lucide-react';
import { ProductNavLink } from '../navigation/ProductNavLink';
import { MESSAGES_PATH, PLAN_PATH } from '../../config/surfacePaths';
import { useInboxUnreadCount } from '../../hooks/useInboxUnreadCount';
import { NotificationBellPopover } from './NotificationBellPopover';

const HUB_CALENDAR_HREF = `${PLAN_PATH}?view=plans&filter=all&layout=calendar`;

const iconBtnClass = (compact: boolean) =>
  [
    'relative inline-flex shrink-0 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-white/70 active:scale-95',
    compact ? 'h-9 w-9' : 'h-10 w-10',
  ].join(' ');

type ConsumerHubIconActionsProps = {
  tone?: 'default' | 'light';
  notificationVariant?: 'tab' | 'desktop';
  className?: string;
  compact?: boolean;
  /** Home header matches mock — chat + bell only. */
  showCalendar?: boolean;
};

/** Chat · calendar · bell — Home header and other consumer tab headers. */
export const ConsumerHubIconActions = ({
  tone = 'default',
  notificationVariant = 'tab',
  className = '',
  compact = false,
  showCalendar = true,
}: ConsumerHubIconActionsProps) => {
  const unread = useInboxUnreadCount();
  const iconClass = compact ? 'h-[18px] w-[18px]' : 'h-5 w-5';
  const btnClass = iconBtnClass(compact);

  return (
    <div className={`flex shrink-0 items-center gap-0.5 ${className}`}>
      <ProductNavLink to={MESSAGES_PATH} className={btnClass} aria-label="Chat">
        <MessageSquare className={iconClass} strokeWidth={2.1} />
        {unread > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </ProductNavLink>
      {showCalendar ? (
        <ProductNavLink to={HUB_CALENDAR_HREF} className={btnClass} aria-label="Calendar">
          <CalendarDays className={iconClass} strokeWidth={2.1} />
        </ProductNavLink>
      ) : null}
      <NotificationBellPopover triggerVariant={notificationVariant} tone={tone} compact={compact} />
    </div>
  );
};
