import { ACTIVITIES_PATH, EXPLORE_MAP_PATH, TRIPS_PATH } from '../../config/routingCatalog';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { accountRouteByRole } from '../../utils/authRouting';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { DESKTOP_NAV_LINKS, MEMBERSHIP_NAV_LINK } from '../../config/platform';
import { SecureAvatar } from '../ui/SecureAvatar';
import { ConsumerHeaderActions } from './ConsumerHeaderActions';

export const Header = () => {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const [searchParams] = useSearchParams();
  const { href: signInHref } = buildSignInRedirect({ pathname, search });
  const navLinks = [
    ...DESKTOP_NAV_LINKS,
    ...(MEMBERSHIP_NAV_LINK ? [MEMBERSHIP_NAV_LINK] : []),
  ];

  const isActiveLink = (to: string) => {
    if (to === '/') return pathname === '/';
    if (to === EXPLORE_MAP_PATH) {
      if (pathname === EXPLORE_MAP_PATH || pathname === '/discovery') {
        return true;
      }
      if (pathname === TRIPS_PATH || pathname === ACTIVITIES_PATH) {
        const tab = searchParams.get('tab');
        return tab !== 'joined' && tab !== 'hosted';
      }
      return false;
    }
    return pathname.startsWith(to);
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-11 lg:h-12">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
              <Mountain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight lg:text-[15px]">UAE Trail</span>
          </Link>

          <nav className="hidden md:flex space-x-1 items-center mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActiveLink(link.to)
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ConsumerHeaderActions notificationVariant="desktop" showOnDesktop />
            {user ? (
              <Link
                to={accountRouteByRole(user.role)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-sm shadow-emerald-200/80"
              >
                <SecureAvatar
                  src={user.avatarUrl}
                  name={user.displayName || user.email || 'Account'}
                  className="w-8 h-8 text-sm"
                />
                {user.displayName?.split(' ')[0] || 'Account'}
              </Link>
            ) : (
              <Link
                to={signInHref}
                className="hidden md:inline-flex items-center px-4 py-1.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-sm shadow-emerald-200/80"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
