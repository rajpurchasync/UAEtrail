import { EXPLORE_MAP_PATH, joinAuthPath } from '../../config/routingCatalog';
import { Link, useLocation } from 'react-router-dom';
import { HelpCircle, Mountain } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { DESKTOP_PRIMARY_NAV, isDesktopNavItemActive } from '../../config/desktopNav';
import { ConsumerHeaderActions } from './ConsumerHeaderActions';
import { DesktopAccountMenu } from './desktop/DesktopAccountMenu';

const desktopNavLinkClass = (active: boolean) =>
  `relative inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold transition-colors lg:gap-2 lg:px-3 ${
    active ? 'bg-emerald-50 text-emerald-700' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
  }`;

export const Header = () => {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const { href: signInHref } = buildSignInRedirect({ pathname, search });
  const primaryNav = DESKTOP_PRIMARY_NAV.filter((item) => user || !item.authGate);

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="w-full px-4 sm:px-5 lg:px-5">
        <div className="flex justify-between items-center h-11 lg:h-12">
          <Link to="/" className="flex items-center space-x-2 lg:min-w-[12rem]" aria-label="UAE Trail home">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center lg:h-8 lg:w-8">
              <Mountain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight lg:text-base">UAE Trail</span>
          </Link>

          {user ? (
            <div className="flex-1" />
          ) : (
            <nav aria-label="Primary" className="mx-auto hidden items-center gap-0.5 md:flex lg:gap-1">
              {primaryNav.map((item) => {
                const active = isDesktopNavItemActive(item, pathname, search);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={desktopNavLinkClass(active)}
                  >
                    <Icon className="hidden h-[18px] w-[18px] xl:block" strokeWidth={active ? 2.4 : 2} aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
              <Link to="/faq" className={desktopNavLinkClass(pathname === '/faq')}>
                <HelpCircle className="hidden h-[18px] w-[18px] xl:block" aria-hidden />
                Help
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-2 lg:min-w-[12rem] lg:justify-end">
            <ConsumerHeaderActions notificationVariant="desktop" showOnDesktop menuClassName="md:hidden" />
            {user ? (
              <div className="hidden md:block">
                <DesktopAccountMenu />
              </div>
            ) : (
              <>
                <Link
                  to={signInHref}
                  className="hidden md:inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
                >
                  Sign in
                </Link>
                <Link
                  to={joinAuthPath(EXPLORE_MAP_PATH)}
                  className="hidden md:inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-sm shadow-emerald-200/80"
                >
                  Join free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
