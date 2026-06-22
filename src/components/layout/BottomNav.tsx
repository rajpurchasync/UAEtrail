import { Link, useLocation } from 'react-router-dom';
import { iconStroke, MOBILE_NAV_ICON_MAP } from '../../config/navIcons';
import { isConsumerChromeHidden, MOBILE_NAV } from '../../config/platform';
import { useAuth } from '../../context/AuthContext';
import { accountRouteByRole } from '../../utils/authRouting';
import { getInitials } from '../../utils/userDisplay';

export const BottomNav = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  if (isConsumerChromeHidden(pathname)) return null;

  const profileDestination = user
    ? accountRouteByRole(user.role)
    : { pathname: '/signin', state: { from: pathname } };

  const isActive = (tab: (typeof MOBILE_NAV)[number]) =>
    tab.match.some((prefix) =>
      prefix === '/'
        ? pathname === '/'
        : pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none"
      aria-label="Main navigation"
    >
      <div
        className="pointer-events-auto mx-3 mb-3 rounded-[28px] glass-nav"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-stretch justify-around px-1 pt-2.5 pb-1">
          {MOBILE_NAV.map((tab) => {
            const active = isActive(tab);
            const Icon = MOBILE_NAV_ICON_MAP[tab.label];
            const isProfile = tab.label === 'Profile';
            const destination = isProfile ? profileDestination : tab.to;
            return (
              <Link
                key={tab.to}
                to={destination}
                className="group flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[52px] rounded-2xl transition-all duration-200 active:scale-90"
                aria-current={active ? 'page' : undefined}
                aria-label={isProfile && user ? 'Your account' : tab.label}
              >
                <span
                  className={`flex items-center justify-center rounded-2xl transition-all duration-300 ${
                    active
                      ? 'w-11 h-11 bg-emerald-600/12 shadow-sm shadow-emerald-600/10'
                      : 'w-10 h-10'
                  }`}
                >
                  {isProfile && user ? (
                    user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className={`rounded-full object-cover ${
                          active ? 'w-[22px] h-[22px] ring-2 ring-emerald-600/30' : 'w-5 h-5'
                        }`}
                      />
                    ) : (
                      <span
                        className={`rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center ${
                          active ? 'w-[22px] h-[22px] text-[10px]' : 'w-5 h-5 text-[9px]'
                        }`}
                      >
                        {getInitials(user.displayName, user.email)}
                      </span>
                    )
                  ) : (
                    <Icon
                      className={`transition-all duration-200 text-emerald-600 ${
                        active ? 'w-[22px] h-[22px]' : 'w-5 h-5 opacity-70'
                      }`}
                      strokeWidth={active ? iconStroke.active : iconStroke.default}
                      fill="none"
                    />
                  )}
                </span>
                <span
                  className={`text-[10px] leading-tight tracking-tight transition-colors ${
                    active
                      ? 'font-bold text-emerald-700 opacity-100'
                      : 'font-medium text-emerald-600/75 opacity-90'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
