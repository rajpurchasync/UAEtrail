import {
  ACTIVITIES_PATH,
  MESSAGES_PATH,
  EXPLORE_MAP_PATH,
  LIST_DISCOVERY_PATH,
  PLAN_PATH,
  TRIPS_PATH,
} from '../../config/routingCatalog';
import { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ClipboardList, Map, MessageSquare, type LucideIcon } from 'lucide-react';

import { PRODUCT_PLAN_SURFACE_TITLE } from '../../content/productNorthStar';
import { useInboxUnreadCount } from '../../hooks/useInboxUnreadCount';
import { useMobileBottomNav } from '../../hooks/useMobileBottomNav';

const tabShellClass = (active: boolean) =>
  [
    'flex min-h-[var(--bottom-nav-height)] flex-col items-center justify-center gap-0.5 px-2 pt-1.5 pb-0.5 transition-colors',
    active ? 'text-emerald-700' : 'text-neutral-500 active:text-neutral-700',
  ].join(' ');

const tabLabelClass = (active: boolean) =>
  ['text-[10px] font-semibold leading-none', active ? 'text-emerald-700' : 'text-neutral-500'].join(' ');

const TabIcon = ({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) => (
  <Icon
    className={`h-5 w-5 shrink-0 ${active ? 'text-emerald-600' : 'text-neutral-400'}`}
    strokeWidth={active ? 2.5 : 2}
    aria-hidden
  />
);

/** Mobile tab bar — Explore · My Plans · Chat (`/plan`). */
export const MobileBottomNav = () => {
  const visible = useMobileBottomNav();
  const { pathname } = useLocation();
  const tripsActive =
    pathname === PLAN_PATH || pathname === TRIPS_PATH || pathname === ACTIVITIES_PATH;
  const exploreActive = pathname === EXPLORE_MAP_PATH || pathname === LIST_DISCOVERY_PATH;
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
      <div className="mx-auto grid max-w-lg grid-cols-3 pb-[var(--safe-bottom)]">
        <NavLink
          to={EXPLORE_MAP_PATH}
          end={pathname !== LIST_DISCOVERY_PATH}
          className={() => tabShellClass(exploreActive)}
          aria-label="Explore"
        >
          {() => (
            <>
              <TabIcon icon={Map} active={exploreActive} />
              <span className={tabLabelClass(exploreActive)}>Explore</span>
            </>
          )}
        </NavLink>

        <Link
          to={PLAN_PATH}
          className={tabShellClass(tripsActive)}
          aria-current={tripsActive ? 'page' : undefined}
          aria-label={PRODUCT_PLAN_SURFACE_TITLE}
        >
          <TabIcon icon={ClipboardList} active={tripsActive} />
          <span className={tabLabelClass(tripsActive)}>{PRODUCT_PLAN_SURFACE_TITLE}</span>
        </Link>

        <NavLink to={MESSAGES_PATH} end className={({ isActive }) => tabShellClass(isActive)} aria-label="Chat">
          {({ isActive }) => (
            <>
              <span className="relative">
                <TabIcon icon={MessageSquare} active={isActive} />
                {unreadMessages > 0 ? (
                  <span className="absolute -right-1.5 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                ) : null}
              </span>
              <span className={tabLabelClass(isActive)}>Chat</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};
