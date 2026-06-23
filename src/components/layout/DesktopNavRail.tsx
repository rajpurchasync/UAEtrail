import { Link, useLocation } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { iconStroke, MOBILE_NAV_ICON_MAP } from '../../config/navIcons';
import { MOBILE_NAV } from '../../config/platform';
import { useAuth } from '../../context/AuthContext';
import { accountRouteByRole } from '../../utils/authRouting';
import { getInitials } from '../../utils/userDisplay';

/** Desktop left icon rail — primary app navigation (replaces top header + bottom nav on md+). */
export const DesktopNavRail = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const profileDestination = user
    ? accountRouteByRole(user.role)
    : { pathname: '/signin', state: { from: pathname } };

  const isActive = (tab: (typeof MOBILE_NAV)[number]) =>
    tab.match.some((prefix) =>
      prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

  return (
    <nav
      className="hidden md:flex flex-col items-center w-[4.5rem] shrink-0 py-4 gap-1 border-r border-gray-100 bg-white/90 backdrop-blur-xl sticky top-0 h-screen z-40"
      aria-label="Main navigation"
    >
      <Link
        to="/"
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-sm shadow-emerald-600/20"
        aria-label="UAE Trail home"
      >
        <Mountain className="w-5 h-5 text-white" />
      </Link>

      {MOBILE_NAV.map((tab) => {
        const active = isActive(tab);
        const Icon = MOBILE_NAV_ICON_MAP[tab.label];
        const isProfile = tab.label === 'Profile';
        const destination = isProfile ? profileDestination : tab.to;

        return (
          <Link
            key={tab.to}
            to={destination}
            title={tab.label}
            className={`group flex flex-col items-center justify-center gap-0.5 w-14 min-h-[3.25rem] rounded-2xl transition-all duration-200 ${
              active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            {isProfile && user ? (
              user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className={`rounded-full object-cover ${active ? 'w-6 h-6 ring-2 ring-emerald-600/30' : 'w-5 h-5'}`}
                />
              ) : (
                <span
                  className={`rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center ${
                    active ? 'w-6 h-6 text-[10px]' : 'w-5 h-5 text-[9px]'
                  }`}
                >
                  {getInitials(user.displayName, user.email)}
                </span>
              )
            ) : (
              <Icon
                className={`transition-all ${active ? 'w-5 h-5' : 'w-[1.125rem] h-[1.125rem] opacity-80'}`}
                strokeWidth={active ? iconStroke.active : iconStroke.default}
              />
            )}
            <span className={`text-[9px] font-medium leading-none ${active ? 'text-emerald-700' : 'text-gray-500'}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
