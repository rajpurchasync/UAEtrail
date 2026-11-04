import { ReactNode, useState } from 'react';
import { APP_PAGE_MIN_H_CLASS, APP_SCROLL_BODY_CLASS } from '../../config/layoutScroll';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MobileBackButton } from '../mobile/MobileBackButton';
import { MobileMenuButton } from './MobileMenu';
import { NotificationBellPopover } from './NotificationBellPopover';
import { AdminConsoleSidebar } from '../admin/AdminConsoleSidebar';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';
import { persistAuthSessionTokens, switchMeRoleSession } from '../../hooks/accountSessionApi';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { ADMIN_LINKS } from '../../constants';
import { ADMIN_NOTIFICATIONS_PATH } from '../../config/adminSurfacePaths';
import { isAdminConsoleNavActive } from '../../admin/adminNavActive';

interface DashboardLayoutProps {
  title: string;
  links: Array<{ to: string; label: string }>;
  children: ReactNode;
}

const adminPageTitle = (pathname: string, fallback: string): string => {
  const match = ADMIN_LINKS.find((link) => isAdminConsoleNavActive(pathname, link.to));
  if (match) return match.label;
  if (isAdminConsoleNavActive(pathname, ADMIN_NOTIFICATIONS_PATH)) return 'Notifications';
  return fallback.replace(/^Admin( · | Dashboard)?/i, '').trim() || fallback;
};

export const DashboardLayout = ({ title, links, children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, refreshUser } = useAuth();
  const unreadNotifications = useNotificationUnreadCount();
  const [switchingRole, setSwitchingRole] = useState(false);
  const isAdminDashboard = location.pathname.startsWith('/admin');

  const handleSignOut = async () => {
    await signOut();
  };

  const switchToVisitor = async () => {
    setSwitchingRole(true);
    try {
      const res = await switchMeRoleSession('participant');
      persistAuthSessionTokens(res.tokens);
      await refreshUser();
      navigate(EXPLORE_MAP_PATH, { replace: true });
    } catch {
      /* noop */
    } finally {
      setSwitchingRole(false);
    }
  };

  if (isAdminDashboard) {
    const pageTitle = adminPageTitle(location.pathname, title);
    return (
      <div className={`${APP_PAGE_MIN_H_CLASS} admin-console-page flex flex-col overflow-hidden bg-gray-50`}>
        <header className="z-40 shrink-0 border-b border-gray-200 bg-white">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-[11px] font-bold text-white sm:inline-flex">
                UT
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Admin console
                </p>
                <h1 className="truncate text-base font-semibold leading-tight text-gray-900">{pageTitle}</h1>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden max-w-[240px] truncate text-xs text-gray-500 md:block">{user?.email}</span>
              <NotificationBellPopover viewAllPath="/admin/notifications" preferAdminRoutes />
              <div className="md:hidden">
                <MobileMenuButton />
              </div>
            </div>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <aside className="product-sidebar-scroll hidden w-[220px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-3 md:block">
            <AdminConsoleSidebar
              pathname={location.pathname}
              unreadNotifications={unreadNotifications}
              onSignOut={handleSignOut}
              onSwitchToVisitor={switchToVisitor}
              switchingRole={switchingRole}
            />
          </aside>
          <div className={`${APP_SCROLL_BODY_CLASS} min-h-0 flex-1 px-4 py-5 sm:px-6`}>
            <main className="mx-auto max-w-6xl">{children}</main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${APP_PAGE_MIN_H_CLASS} overflow-hidden bg-gray-50`}>
      <header className="z-40 shrink-0 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-gray-900 md:text-xl">{title}</h1>
              <p className="hidden truncate text-xs text-gray-500 md:block">{user?.email}</p>
              <MobileBackButton fallbackTo="/" label="Home" className="mt-0.5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <MobileMenuButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl shrink-0 px-4 pt-4 sm:px-6 md:pt-5">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" aria-hidden />
          <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-black/10 blur-2xl" aria-hidden />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Control center</p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">{title}</h2>
          </div>
        </div>
      </section>

      <div
        className={`${APP_SCROLL_BODY_CLASS} mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-4 sm:px-6 md:grid-cols-[200px_1fr] md:py-6 lg:grid-cols-[220px_1fr]`}
      >
        <aside className="hidden md:block">
          <div className="sticky top-20 rounded-2xl border border-gray-100 bg-white p-2">
            <nav className="space-y-0.5">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block rounded-xl px-3 py-2 text-sm transition-all ${
                    location.pathname === link.to
                      ? 'bg-emerald-50 font-semibold text-emerald-800'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
};
