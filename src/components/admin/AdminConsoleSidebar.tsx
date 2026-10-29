import { Link } from 'react-router-dom';
import { LogOut, Map } from 'lucide-react';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { ADMIN_NOTIFICATIONS_PATH } from '../../config/adminSurfacePaths';
import { ADMIN_LINKS } from '../../constants';
import { isAdminConsoleNavActive } from '../../admin/adminNavActive';

type AdminConsoleSidebarProps = {
  pathname: string;
  unreadNotifications: number;
  onSignOut: () => void | Promise<void>;
  onSwitchToVisitor: () => void | Promise<void>;
  switchingRole?: boolean;
};

const navLinkClass = (active: boolean) =>
  `block px-3 py-2 rounded-xl text-sm transition-all ${
    active
      ? 'bg-emerald-50 text-emerald-800 font-semibold'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`;

export const AdminConsoleSidebar = ({
  pathname,
  unreadNotifications,
  onSignOut,
  onSwitchToVisitor,
  switchingRole = false,
}: AdminConsoleSidebarProps) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-2 sticky top-20">
    <nav className="space-y-0.5" aria-label="Admin console">
      {ADMIN_LINKS.map((link) => {
        const active = isAdminConsoleNavActive(pathname, link.to);
        return (
          <Link key={link.to} to={link.to} className={navLinkClass(active)} aria-current={active ? 'page' : undefined}>
            {link.label}
          </Link>
        );
      })}
      <Link
        to={ADMIN_NOTIFICATIONS_PATH}
        className={`${navLinkClass(isAdminConsoleNavActive(pathname, ADMIN_NOTIFICATIONS_PATH))} flex items-center justify-between gap-2`}
      >
        <span>Notifications</span>
        {unreadNotifications > 0 ? (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
            {unreadNotifications > 99 ? '99+' : unreadNotifications}
          </span>
        ) : null}
      </Link>
      <div className="my-2 border-t border-gray-100" />
      <Link to={EXPLORE_MAP_PATH} className={`${navLinkClass(false)} flex items-center gap-2`}>
        <Map className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
        Explore map
      </Link>
      <button
        type="button"
        disabled={switchingRole}
        onClick={() => void onSwitchToVisitor()}
        className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all disabled:opacity-60"
      >
        {switchingRole ? 'Switching…' : 'Switch to visitor'}
      </button>
      <button
        type="button"
        onClick={() => void onSignOut()}
        className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all border-t border-gray-100 pt-3"
      >
        <LogOut className="w-4 h-4" aria-hidden />
        Sign out
      </button>
    </nav>
  </div>
);
