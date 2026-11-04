import { Link } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  FileClock,
  Flag,
  LayoutDashboard,
  LogOut,
  MapPin,
  MapPinned,
  Megaphone,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
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

const NAV_ICONS: Record<string, LucideIcon> = {
  Overview: LayoutDashboard,
  Areas: MapPinned,
  Places: MapPin,
  Activities: CalendarDays,
  Facilities: Building2,
  'Users & Members': Users,
  Operators: Briefcase,
  Groups: UsersRound,
  Reports: Flag,
  'Audit Log': FileClock,
  Broadcast: Megaphone,
};

const navLinkClass = (active: boolean) =>
  `group flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
    active
      ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-sm'
      : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-900 hover:translate-x-0.5 hover:shadow-sm'
  }`;

export const AdminConsoleSidebar = ({
  pathname,
  unreadNotifications,
  onSignOut,
  onSwitchToVisitor,
  switchingRole = false,
}: AdminConsoleSidebarProps) => (
  <nav className="space-y-0.5" aria-label="Admin console">
    {ADMIN_LINKS.map((link) => {
      const active = isAdminConsoleNavActive(pathname, link.to);
      const Icon = NAV_ICONS[link.label] ?? LayoutDashboard;
      return (
        <Link key={link.to} to={link.to} className={navLinkClass(active)} aria-current={active ? 'page' : undefined}>
          <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          {link.label}
        </Link>
      );
    })}
    <Link
      to={ADMIN_NOTIFICATIONS_PATH}
      className={`${navLinkClass(isAdminConsoleNavActive(pathname, ADMIN_NOTIFICATIONS_PATH))} justify-between`}
    >
      <span className="flex items-center gap-2.5">
        <Bell className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        Notifications
      </span>
      {unreadNotifications > 0 ? (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
          {unreadNotifications > 99 ? '99+' : unreadNotifications}
        </span>
      ) : null}
    </Link>
    <div className="my-2 border-t border-gray-100" />
    <button
      type="button"
      disabled={switchingRole}
      onClick={() => void onSwitchToVisitor()}
      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-600 transition-all duration-150 hover:translate-x-0.5 hover:bg-emerald-50 hover:text-emerald-900 hover:shadow-sm disabled:opacity-60"
    >
      <UserRound className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      {switchingRole ? 'Switching…' : 'Switch to visitor'}
    </button>
    <button
      type="button"
      onClick={() => void onSignOut()}
      className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-gray-100 px-3 py-2 pt-3 text-sm text-red-600 transition-all duration-150 hover:translate-x-0.5 hover:bg-red-50 hover:shadow-sm"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Sign out
    </button>
  </nav>
);
