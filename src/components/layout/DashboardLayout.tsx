import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MobileBackButton } from '../mobile/MobileBackButton';
import { MobileMenuButton } from './MobileMenu';interface DashboardLayoutProps {
  title: string;
  links: Array<{ to: string; label: string }>;
  children: ReactNode;
}

export const DashboardLayout = ({ title, links, children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isAdminDashboard = location.pathname.startsWith('/admin');

  const handleSignOut = async () => {
    await signOut();
  };

  const breadcrumbFallbackTo =
    location.pathname.startsWith('/admin')
      ? '/admin/overview'
      : location.pathname.startsWith('/merchant')
        ? '/merchant/dashboard'
        : location.pathname.startsWith('/organizer')
          ? '/organizer/overview'
          : '/';

  const breadcrumbLabel =
    location.pathname.startsWith('/admin')
      ? 'Admin'
      : location.pathname.startsWith('/merchant')
        ? 'Merchant'
        : location.pathname.startsWith('/organizer')
          ? 'Organizer'
          : 'Home';

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* ─── Mobile-friendly header ─── */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
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
          {!isAdminDashboard && (
            <div className="flex items-center gap-1.5 md:gap-2">
              <MobileMenuButton showOnDesktop />
            </div>
          )}
        </div>

        {/* ─── Horizontal scroll nav (mobile) / hidden on desktop ─── */}
        <div className="md:hidden border-t border-gray-100 overflow-x-auto scrollbar-none">
          <div className="flex px-2 py-1.5 gap-0.5 min-w-max">
            {links.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAdminDashboard && (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap text-red-600 hover:bg-red-50 active:bg-red-100 transition-all"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      {!isAdminDashboard && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 md:pt-5">
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

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 ${isAdminDashboard ? 'pt-4 md:pt-6' : 'py-4 md:py-6'} grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr] gap-6`}>
        {/* Desktop sidebar */}
        <aside className="hidden md:block">
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
              {isAdminDashboard && (
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all border-t border-gray-100 pt-3"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              )}
            </nav>
          </div>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
};
