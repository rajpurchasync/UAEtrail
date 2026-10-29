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

interface DashboardLayoutProps {
  title: string;
  links: Array<{ to: string; label: string }>;
  children: ReactNode;
}

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

  const breadcrumbFallbackTo = isAdminDashboard ? '/admin/overview' : '/';

  const breadcrumbLabel = isAdminDashboard ? 'Admin' : 'Home';

  return (
    <div className={`${APP_PAGE_MIN_H_CLASS} overflow-hidden bg-gray-50/80`}>
      <header className="shrink-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">{title}</h1>
              <p className="text-xs text-gray-500 truncate hidden md:block">{user?.email}</p>
              <MobileBackButton
                fallbackTo={breadcrumbFallbackTo}
                label={breadcrumbLabel}
                className="mt-0.5"
              />
            </div>
          </div>
          {isAdminDashboard ? (
            <div className="flex items-center gap-1.5 md:gap-2">
              <NotificationBellPopover viewAllPath="/admin/notifications" preferAdminRoutes />
              <MobileMenuButton />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 md:gap-2">
              <MobileMenuButton />
            </div>
          )}
        </div>
      </header>

      {!isAdminDashboard && (
        <section className="shrink-0 max-w-7xl mx-auto px-4 sm:px-6 pt-4 md:pt-5">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 py-4 sm:px-6 sm:py-5 text-white">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" aria-hidden />
            <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-black/10 blur-2xl" aria-hidden />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Control center</p>
              <h2 className="text-xl sm:text-2xl font-bold mt-1">{title}</h2>
            </div>
          </div>
        </section>
      )}

      <div
        className={`${APP_SCROLL_BODY_CLASS} max-w-7xl mx-auto px-4 sm:px-6 ${isAdminDashboard ? 'pt-4 md:pt-6' : 'py-4 md:py-6'} grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr] gap-6`}
      >
        <aside className="hidden md:block">
          {isAdminDashboard ? (
            <AdminConsoleSidebar
              pathname={location.pathname}
              unreadNotifications={unreadNotifications}
              onSignOut={handleSignOut}
              onSwitchToVisitor={switchToVisitor}
              switchingRole={switchingRole}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-2 sticky top-20">
              <nav className="space-y-0.5">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block px-3 py-2 rounded-xl text-sm transition-all ${
                      location.pathname === link.to
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-2 border-t border-gray-100" />
                <Link
                  to="/"
                  className="block px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
                >
                  Landing page
                </Link>
              </nav>
            </div>
          )}
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
};
