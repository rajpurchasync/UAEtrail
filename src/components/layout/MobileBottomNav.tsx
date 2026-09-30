import { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ClipboardList, Map, MessageSquare, type LucideIcon } from 'lucide-react';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import { useInboxUnreadCount } from '../../hooks/useInboxUnreadCount';
import { useMobileBottomNav } from '../../hooks/useMobileBottomNav';

const tabShellClass = (active: boolean) =>
  [
    'flex min-h-[var(--bottom-nav-height)] items-center justify-center px-3 transition-colors',
    active ? 'text-emerald-700' : 'text-neutral-500 active:text-neutral-700',
  ].join(' ');

const TabIcon = ({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) => (
  <Icon
    className={`h-5 w-5 shrink-0 ${active ? 'text-emerald-600' : 'text-neutral-400'}`}
    strokeWidth={active ? 2.5 : 2}
    aria-hidden
  />
);

/** Signed-in mobile tab bar — Map · My Activities · Messages. */
export const MobileBottomNav = () => {
  const visible = useMobileBottomNav();
  const { pathname } = useLocation();
  const activitiesActive = pathname === '/activities';
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
          end
          className={({ isActive }) => tabShellClass(isActive)}
          aria-label="Map"
        >
          {({ isActive }) => <TabIcon icon={Map} active={isActive} />}
        </NavLink>

        <Link
          to="/activities?tab=joined"
          className={tabShellClass(activitiesActive)}
          aria-current={activitiesActive ? 'page' : undefined}
          aria-label="My activities"
        >
          <TabIcon icon={ClipboardList} active={activitiesActive} />
        </Link>

        <NavLink to="/messages" end className={({ isActive }) => tabShellClass(isActive)} aria-label="Messages">
          {({ isActive }) => (
            <span className="relative">
              <TabIcon icon={MessageSquare} active={isActive} />
              {unreadMessages > 0 ? (
                <span className="absolute -right-1.5 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              ) : null}
            </span>
          )}
        </NavLink>
      </div>
    </nav>
  );
};
