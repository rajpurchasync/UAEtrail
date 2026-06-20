import { Compass, Map, ShoppingBag, Users, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MOBILE_NAV } from '../../config/platform';

const iconMap = {
  Explore: Map,
  Trips: Compass,
  Community: Users,
  Shop: ShoppingBag,
  Profile: User
} as const;

export const BottomNav = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const hidden =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/organizer') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/merchant') ||
    pathname === '/signin' ||
    pathname === '/signup' ||
    pathname === '/verify' ||
    pathname === '/onboarding' ||
    pathname === '/forgot-password';

  if (hidden) return null;

  const tabs = MOBILE_NAV.filter((tab) => tab.label !== 'Profile' || user);

  const isActive = (tab: (typeof MOBILE_NAV)[number]) =>
    tab.match.some((prefix) => (prefix === '/discovery' ? pathname === '/discovery' || pathname.startsWith('/trail') || pathname.startsWith('/camp') : pathname.startsWith(prefix)));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50">
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/80" />
      <div className="relative flex justify-around items-center h-16 max-w-lg mx-auto px-2 safe-area-bottom">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = iconMap[tab.label as keyof typeof iconMap] ?? Compass;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                active ? 'text-emerald-600' : 'text-gray-600 active:text-gray-700'
              }`}
            >
              {active && <span className="absolute top-1 w-6 h-0.5 rounded-full bg-emerald-500" />}
              <span className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-emerald-50' : ''}`}>
                <Icon
                  className={`transition-all duration-200 ${active ? 'w-[22px] h-[22px]' : 'w-[21px] h-[21px]'}`}
                  strokeWidth={active ? 2.2 : 2}
                />
              </span>
              <span className={`text-xs mt-0.5 leading-tight transition-all ${active ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
