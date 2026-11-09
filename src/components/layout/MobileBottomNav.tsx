import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, MapPin, MessageSquare, Users, type LucideIcon } from 'lucide-react';

import { NAV_ICONS } from '../../config/navIcons';
import {
  MOBILE_FIVE_TAB_UI_LABELS,
  MOBILE_FIVE_TAB_ORDER,
  mobileFiveTabHomePath,
  resolveMobileFiveTab,
  type MobileFiveTabId,
} from '../../config/mobileFiveTabNav';
import { useInboxUnreadCount } from '../../hooks/useInboxUnreadCount';
import { useMobileBottomNav } from '../../hooks/useMobileBottomNav';

const TAB_ICONS: Record<MobileFiveTabId, LucideIcon> = {
  trips: NAV_ICONS.trips,
  venues: MapPin,
  crews: Users,
  plan: ClipboardList,
  chat: MessageSquare,
};

const tabShellClass = (active: boolean) =>
  [
    'flex min-h-[var(--bottom-nav-height)] min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 pt-1.5 pb-0.5 transition-colors',
    active ? 'text-emerald-700' : 'text-neutral-500 active:text-neutral-700',
  ].join(' ');

const tabLabelClass = (active: boolean) =>
  [
    'max-w-full truncate text-[10px] font-semibold leading-none sm:text-[11px]',
    active ? 'text-emerald-700' : 'text-neutral-500',
  ].join(' ');

const TabIcon = ({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) => (
  <Icon
    className={`h-[1.125rem] w-[1.125rem] shrink-0 sm:h-5 sm:w-5 ${active ? 'text-emerald-600' : 'text-neutral-400'}`}
    strokeWidth={active ? 2.5 : 2}
    aria-hidden
  />
);

/** Mobile tab bar — Trips · Venues · Plans · Crews · Chat (`mobileFiveTabHomePath`). */
export const MobileBottomNav = () => {
  const visible = useMobileBottomNav();
  const { pathname, search } = useLocation();
  const activeTab = resolveMobileFiveTab(pathname, search);
  const unreadMessages = useInboxUnreadCount();

  useEffect(() => {
    if (visible) {
      document.documentElement.setAttribute('data-mobile-bottom-nav', 'true');
    } else {
      document.documentElement.removeAttribute('data-mobile-bottom-nav');
    }
    return () => document.documentElement.removeAttribute('data-mobile-bottom-nav');
  }, [visible]);

  if (!visible) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-[1200] border-t border-neutral-200/80 bg-white/95 backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 pb-[var(--safe-bottom)]">
        {MOBILE_FIVE_TAB_ORDER.map((tab) => {
          const label = MOBILE_FIVE_TAB_UI_LABELS[tab];
          const active = activeTab === tab;
          const href = mobileFiveTabHomePath(tab);
          const isChat = tab === 'chat';

          return (
            <Link
              key={tab}
              to={href}
              className={tabShellClass(active)}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
            >
              {isChat ? (
                <span className="relative">
                  <TabIcon icon={TAB_ICONS[tab]} active={active} />
                  {unreadMessages > 0 ? (
                    <span className="absolute -right-1.5 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-0.5 text-[9px] font-bold text-white ring-2 ring-white">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  ) : null}
                </span>
              ) : (
                <TabIcon icon={TAB_ICONS[tab]} active={active} />
              )}
              <span className={tabLabelClass(active)}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
