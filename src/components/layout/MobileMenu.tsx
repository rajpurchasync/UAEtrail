import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Menu, RefreshCw, ShoppingBag, X } from 'lucide-react';
import { iconStroke, MOBILE_NAV_ICON_MAP } from '../../config/navIcons';
import { isConsumerChromeHidden, MOBILE_DRAWER_MENU } from '../../config/platform';
import { ADMIN_LINKS, HOST_DASHBOARD_LINKS, MERCHANT_DASHBOARD_LINKS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/services';
import { setStoredSession } from '../../api/client';
import { accountRouteByRole } from '../../utils/authRouting';
import { SecureAvatar } from '../ui/SecureAvatar';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';

type MobileMenuTone = 'default' | 'light';

type DashboardNavLink = { to: string; label: string };

interface MobileMenuContextValue {
  open: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

interface MobileMenuProviderProps {
  children: ReactNode;
}

const navItemClass = (active: boolean) =>
  `flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
    active ? 'bg-emerald-50 text-emerald-800' : 'text-gray-700 hover:bg-gray-50'
  }`;

/** Compact text links for admin / host / merchant mobile drawers (matches desktop sidebar). */
const dashboardLinkClass = (active: boolean) =>
  `block px-3 py-2.5 rounded-xl text-sm transition-colors ${
    active ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-gray-700 hover:bg-gray-50'
  }`;

const dashboardActionClass =
  'block w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors';

const DashboardDrawerDivider = () => <div className="my-2 border-t border-gray-100" role="presentation" />;

const isPathActive = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(`${to}/`);

type MobileDrawerProps = {
  open: boolean;
  closeMenu: () => void;
  eyebrow: string;
  title: string;
  ariaLabel: string;
  children: ReactNode;
};

const MobileDrawer = ({ open, closeMenu, eyebrow, title, ariaLabel, children }: MobileDrawerProps) => (
  <div
    className={`fixed inset-0 z-[70] transition-opacity duration-200 ${
      open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`}
    aria-hidden={!open}
  >
    <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={closeMenu} />
    <aside
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className={`absolute inset-y-0 right-0 w-[min(100vw-3rem,20rem)] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-safe-plus-2 pb-4 border-b border-gray-100">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600/90">{eyebrow}</p>
          <p className="text-lg font-bold text-gray-900 truncate">{title}</p>
        </div>
        <button
          type="button"
          onClick={closeMenu}
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3 pb-safe" aria-label={ariaLabel}>
        <div className="space-y-0.5">{children}</div>
      </nav>
    </aside>
  </div>
);

const DashboardDrawerLinks = ({
  links,
  pathname,
  closeMenu,
}: {
  links: readonly DashboardNavLink[];
  pathname: string;
  closeMenu: () => void;
}) => (
  <>
    {links.map((link) => {
      const active = isPathActive(pathname, link.to);
      return (
        <Link
          key={link.to}
          to={link.to}
          onClick={closeMenu}
          className={dashboardLinkClass(active)}
          aria-current={active ? 'page' : undefined}
        >
          {link.label}
        </Link>
      );
    })}
  </>
);

const DashboardDrawerSiteLink = ({ closeMenu }: { closeMenu: () => void }) => (
  <>
    <DashboardDrawerDivider />
    <Link to="/" onClick={closeMenu} className={dashboardLinkClass(false)}>
      Landing page
    </Link>
  </>
);

export const MobileMenuProvider = ({ children }: MobileMenuProviderProps) => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const closeMenu = useCallback(() => setOpen(false), []);
  const openMenu = useCallback(() => setOpen(true), []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, closeMenu]);

  return (
    <MobileMenuContext.Provider value={{ open, openMenu, closeMenu }}>
      {children}
      <MobileMenuPanel />
    </MobileMenuContext.Provider>
  );
};

const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error('useMobileMenu must be used within MobileMenuProvider');
  }
  return context;
};

interface MobileMenuButtonProps {
  tone?: MobileMenuTone;
  className?: string;
  showOnDesktop?: boolean;
}

export const MobileMenuButton = ({ tone = 'default', className = '', showOnDesktop = false }: MobileMenuButtonProps) => {
  const { openMenu } = useMobileMenu();
  const unreadCount = useNotificationUnreadCount();
  const toneClass =
    tone === 'light'
      ? 'text-white bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25'
      : 'text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100';

  const badgeRing = tone === 'light' ? 'ring-white' : 'ring-emerald-50';

  return (
    <button
      type="button"
      onClick={openMenu}
      className={`${showOnDesktop ? '' : 'md:hidden'} relative h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full transition-colors active:scale-95 ${toneClass} ${className}`}
      aria-label={unreadCount > 0 ? `Open menu, ${unreadCount} unread notifications` : 'Open menu'}
    >
      <Menu className="w-5 h-5" strokeWidth={2.25} />
      {unreadCount > 0 && (
        <span
          className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ${badgeRing}`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

const MobileMenuPanel = () => {
  const { open, closeMenu } = useMobileMenu();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut, refreshUser } = useAuth();
  const unreadNotifications = useNotificationUnreadCount();

  const isOrganizerRole =
    user?.role === 'tenant_owner' || user?.role === 'tenant_admin' || user?.role === 'tenant_guide';
  const isAdminRole = user?.role === 'platform_admin';
  const isMerchantRole = user?.role === 'merchant_admin';
  const isPrivilegedRole = isOrganizerRole || isAdminRole || isMerchantRole;
  const canSwitchBack = user?.role === 'participant' && Boolean(user?.switchedFromRole);

  // only hide for admin/merchant/organizer shells — they use their own burger
  if (isConsumerChromeHidden(pathname) && !isPrivilegedRole) return null;

  const profileDestination = user
    ? accountRouteByRole(user.role)
    : { pathname: '/signin', state: { from: pathname } };

  const isActive = (match: readonly string[]) =>
    match.some((prefix) =>
      prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

  const drawerItems = MOBILE_DRAWER_MENU.map((item) => ({
    ...item,
    icon: MOBILE_NAV_ICON_MAP[item.label],
    destination: 'profileLink' in item && item.profileLink ? profileDestination : item.to,
  }));

  const switchRole = async (target: 'participant' | 'original') => {
    closeMenu();
    try {
      const res = await api.switchMeRole(target);
      setStoredSession(res.tokens);
      await refreshUser();
      navigate(target === 'participant' ? '/' : accountRouteByRole(res.data.role as Parameters<typeof accountRouteByRole>[0]), { replace: true });
    } catch { /* noop */ }
  };

  if (isAdminRole) {
    return (
      <MobileDrawer
        open={open}
        closeMenu={closeMenu}
        eyebrow="Admin"
        title={user?.displayName || 'Account'}
        ariaLabel="Admin navigation"
      >
        <DashboardDrawerLinks links={ADMIN_LINKS} pathname={pathname} closeMenu={closeMenu} />
        <Link
          to="/admin/notifications"
          onClick={closeMenu}
          className={`${dashboardLinkClass(pathname.startsWith('/admin/notifications'))} flex items-center justify-between gap-2`}
        >
          <span>Notifications</span>
          {unreadNotifications > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </span>
          )}
        </Link>
        <DashboardDrawerSiteLink closeMenu={closeMenu} />
        <button
          type="button"
          onClick={() => void switchRole('participant')}
          className={dashboardActionClass}
        >
          Switch to Visitor
        </button>
        <button
          type="button"
          onClick={async () => {
            closeMenu();
            await signOut();
          }}
          className={`${dashboardActionClass} text-red-600 hover:bg-red-50`}
        >
          Sign Out
        </button>
      </MobileDrawer>
    );
  }

  if (isMerchantRole) {
    return (
      <MobileDrawer
        open={open}
        closeMenu={closeMenu}
        eyebrow="Merchant"
        title={user?.displayName || 'Account'}
        ariaLabel="Merchant navigation"
      >
        <DashboardDrawerLinks links={MERCHANT_DASHBOARD_LINKS} pathname={pathname} closeMenu={closeMenu} />
        <DashboardDrawerSiteLink closeMenu={closeMenu} />
        <button type="button" onClick={() => void switchRole('participant')} className={dashboardActionClass}>
          Switch to Visitor
        </button>
        <button
          type="button"
          onClick={async () => {
            closeMenu();
            await signOut();
          }}
          className={`${dashboardActionClass} text-red-600 hover:bg-red-50`}
        >
          Sign Out
        </button>
      </MobileDrawer>
    );
  }

  if (isOrganizerRole) {
    return (
      <MobileDrawer
        open={open}
        closeMenu={closeMenu}
        eyebrow="Host"
        title={user?.displayName || 'Account'}
        ariaLabel="Host navigation"
      >
        <DashboardDrawerLinks links={HOST_DASHBOARD_LINKS} pathname={pathname} closeMenu={closeMenu} />
        <DashboardDrawerSiteLink closeMenu={closeMenu} />
        <button type="button" onClick={() => void switchRole('participant')} className={dashboardActionClass}>
          Switch to Visitor
        </button>
        <button
          type="button"
          onClick={async () => {
            closeMenu();
            await signOut();
          }}
          className={`${dashboardActionClass} text-red-600 hover:bg-red-50`}
        >
          Sign Out
        </button>
      </MobileDrawer>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[70] transition-opacity duration-200 ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close menu"
        onClick={closeMenu}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        className={`absolute inset-y-0 right-0 w-[min(100vw-3rem,20rem)] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-safe-plus-2 pb-4 border-b border-gray-100">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600/90">Menu</p>
            <p className="text-lg font-bold text-gray-900 truncate">UAE Trail</p>
          </div>
          <button
            type="button"
            onClick={closeMenu}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 pb-safe space-y-1" aria-label="App navigation">
          {drawerItems.map((item) => {
            const active = isActive(item.match);
            const Icon = item.icon;
            const showAvatar = item.label === 'My Profile' && user;

            return (
              <Link
                key={item.label}
                to={item.destination}
                onClick={closeMenu}
                className={navItemClass(active)}
                aria-current={active ? 'page' : undefined}
              >
                {showAvatar ? (
                  <SecureAvatar
                    src={user.avatarUrl}
                    name={user.displayName || user.email || 'Account'}
                    className="w-9 h-9 text-sm"
                  />
                ) : (
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      active ? 'bg-emerald-600/12' : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${active ? 'text-emerald-700' : 'text-gray-600'}`}
                      strokeWidth={active ? iconStroke.active : iconStroke.default}
                    />
                  </span>
                )}
                <span className="font-semibold">{item.label}</span>
                {item.label === 'Notifications' && unreadNotifications > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Link>
            );
          })}

          {user && !isMerchantRole && (
            <Link
              to="/become-host#host-profiles"
              onClick={closeMenu}
              className={navItemClass(pathname.startsWith('/become-host'))}
            >
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100">
                <ShoppingBag className="w-5 h-5 text-gray-600" strokeWidth={iconStroke.default} />
              </span>
              <span className="font-semibold">Host on the map</span>
            </Link>
          )}

          {canSwitchBack && (
            <button
              type="button"
              onClick={() => void switchRole('original')}
              className={`w-full ${navItemClass(false)}`}
            >
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50">
                <RefreshCw className="w-5 h-5 text-emerald-600" strokeWidth={iconStroke.default} />
              </span>
              <span className="font-semibold text-emerald-700">Restore {user?.switchedFromRole?.replace(/_/g, ' ')}</span>
            </button>
          )}

          {user ? (
            <button
              type="button"
              onClick={async () => {
                closeMenu();
                await signOut();
              }}
              className={`w-full ${navItemClass(false)}`}
            >
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100">
                <LogOut className="w-5 h-5 text-gray-600" strokeWidth={iconStroke.default} />
              </span>
              <span className="font-semibold">Sign Out</span>
            </button>
          ) : (
            <Link
              to="/signin"
              state={{ from: pathname }}
              onClick={closeMenu}
              className={navItemClass(false)}
            >
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-600">
                <LogIn className="w-5 h-5 text-white" strokeWidth={iconStroke.default} />
              </span>
              <span className="font-semibold">Sign In</span>
            </Link>
          )}
        </nav>
      </aside>
    </div>
  );
};
