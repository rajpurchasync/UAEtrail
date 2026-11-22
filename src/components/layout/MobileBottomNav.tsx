import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useProductLocation } from '../../routing/useEffectiveLocation';
import { ProductNavLink } from '../navigation/ProductNavLink';
import { ClipboardList, Home, MapPin, MessageSquare, Users, type LucideIcon } from 'lucide-react';

import { NAV_ICONS } from '../../config/navIcons';
import {
  MOBILE_BOTTOM_TAB_UI_LABELS,
  mobileBottomTabHomePath,
  mobileBottomTabOrder,
  resolveMobileBottomTab,
  type MobileBottomTabId,
} from '../../config/mobileFiveTabNav';
import { useInboxUnreadCount } from '../../hooks/useInboxUnreadCount';
import { useMobileBottomNav } from '../../hooks/useMobileBottomNav';

const TAB_ICONS: Record<MobileBottomTabId, LucideIcon> = {
  home: Home,
  trips: NAV_ICONS.trips,
  venues: MapPin,
  crews: Users,
  plan: ClipboardList,
  chat: MessageSquare,
};

const tabShellClass = (active: boolean) =>
  [
    'flex h-full min-h-0 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 pt-1.5 pb-0.5 transition-colors',
    active ? 'text-emerald-700' : 'text-neutral-500 active:text-neutral-700',
  ].join(' ');

const tabLabelClass = (active: boolean) =>
  [
    'max-w-full truncate text-xs font-semibold leading-none',
    active ? 'text-emerald-700' : 'text-neutral-500',
  ].join(' ');

const TabIcon = ({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) => (
  <Icon
    className={`h-6 w-6 shrink-0 ${active ? 'text-emerald-600' : 'text-neutral-400'}`}
    strokeWidth={active ? 2.5 : 2}
    aria-hidden
  />
);

/** Mobile tab bar — Trips · Places · Crews · Chat · Plans (`MOBILE_FIVE_TAB_ORDER`). */
export const MobileBottomNav = () => {
  const visible = useMobileBottomNav();
  const { pathname, search } = useProductLocation();
  const tabs = mobileBottomTabOrder();
  const activeTab = resolveMobileBottomTab(pathname, search);
  const unreadMessages = useInboxUnreadCount();
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (visible) {
      document.documentElement.setAttribute('data-mobile-bottom-nav', 'true');
    } else {
      document.documentElement.removeAttribute('data-mobile-bottom-nav');
    }
    return () => document.documentElement.removeAttribute('data-mobile-bottom-nav');
  }, [visible]);

  if (!visible || !portalReady) return null;

  const nav = (
    <nav
      aria-label="Main"
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[1200] border-t border-neutral-200/80 bg-white/95 pb-[var(--safe-bottom)] backdrop-blur-md md:hidden"
    >
      <div
        className="mx-auto grid h-[var(--bottom-nav-height)] max-w-lg"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const label = MOBILE_BOTTOM_TAB_UI_LABELS[tab];
          const active = activeTab === tab;
          const href = mobileBottomTabHomePath(tab);
          const isChat = tab === 'chat';

          return (
            <ProductNavLink
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
                    <span className="absolute -right-1.5 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-0.5 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  ) : null}
                </span>
              ) : (
                <TabIcon icon={TAB_ICONS[tab]} active={active} />
              )}
              <span className={tabLabelClass(active)}>{label}</span>
            </ProductNavLink>
          );
        })}
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
};
