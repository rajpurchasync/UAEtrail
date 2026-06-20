import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Mountain } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const getInitials = (name?: string | null, email?: string | null) => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? '?';
};

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/discovery', label: 'Trails and Spots' },
    { to: '/trips', label: 'Upcoming Trips' },
    { to: '/shop', label: 'Shop' },
    { to: '/community', label: 'Community' },
    { to: '/membership', label: 'Membership' }
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
            <span className="text-base font-bold text-gray-900 tracking-tight">UAE Trails</span>
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
                to="/dashboard/overview"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm shadow-emerald-200"
              >
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {getInitials(user.displayName, user.email)}
                </span>
                {user.displayName?.split(' ')[0] || 'Dashboard'}
              </Link>
            ) : (
              <Link
                to="/signin"
                className="hidden md:block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm shadow-emerald-200"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActiveLink(link.to)
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 mt-2">
              <Link
                to={user ? '/dashboard/overview' : '/signin'}
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                {user ? 'My Dashboard' : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
