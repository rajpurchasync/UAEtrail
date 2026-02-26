import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Mountain } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/discovery', label: 'Trails and Spots' },
    { to: '/calendar', label: 'Upcoming Trips' },
    { to: '/shop', label: 'Shop' },
    { to: '/community', label: 'Community' },
    { to: '/membership', label: 'Membership' }
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Mountain className="w-6 h-6 text-emerald-600" />
            <span className="text-base font-semibold text-gray-900">UAE Trails</span>
          </Link>

          <nav className="hidden md:flex space-x-6 items-center mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-700 hover:text-emerald-600 transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            to={user ? '/dashboard/overview' : '/signin'}
            className="hidden md:block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            {user ? 'Dashboard' : 'Sign In'}
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-3 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-emerald-600 transition-colors text-sm font-medium py-2"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to={user ? '/dashboard/overview' : '/signin'}
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              {user ? 'Dashboard' : 'Sign In'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
