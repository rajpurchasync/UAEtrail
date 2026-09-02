import { Link, useLocation } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { accountRouteByRole } from '../../utils/authRouting';
import { MEMBERSHIP_NAV_LINK } from '../../config/platform';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';
import { SecureAvatar } from '../ui/SecureAvatar';

export const Header = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const unreadCount = useNotificationUnreadCount();
  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/discovery', label: 'Trails and Spots' },
    { to: '/activities', label: 'Activities' },
    { to: '/shop', label: 'Shop' },
    { to: '/community', label: 'Community' },
    ...(MEMBERSHIP_NAV_LINK ? [MEMBERSHIP_NAV_LINK] : []),
    { to: '/faq', label: 'Help' },
  ];

  const isActiveLink = (to: string) => {
    if (to === '/') return pathname === '/';
    return pathname.startsWith(to);
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
              <Mountain className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 tracking-tight">UAE Trail</span>
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
            {user ? (
              <Link
                to={accountRouteByRole(user.role)}
                className="hidden md:flex relative items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm shadow-emerald-200"
              >
                <SecureAvatar
                  src={user.avatarUrl}
                  name={user.displayName || user.email || 'Account'}
                  className="w-8 h-8 text-sm"
                />
                {user.displayName?.split(' ')[0] || 'Account'}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                to="/signin"
                className="hidden md:block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm shadow-emerald-200"
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
