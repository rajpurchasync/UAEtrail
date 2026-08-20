import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Menu, RefreshCw, X } from 'lucide-react';
import { iconStroke, MOBILE_NAV_ICON_MAP } from '../../config/navIcons';
import { isConsumerChromeHidden, MOBILE_DRAWER_MENU } from '../../config/platform';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/services';
import { setStoredSession } from '../../api/client';
import { accountRouteByRole } from '../../utils/authRouting';
import { SecureAvatar } from '../ui/SecureAvatar';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';

type MobileMenuTone = 'default' | 'light';

interface MobileMenuContextValue {
  open: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

interface MobileMenuProviderProps {
  children: ReactNode;
}

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

export const useMobileMenu = () => {
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
  const canSwitchBack = user?.role === 'visitor' && Boolean(user?.switchedFromRole);

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

  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
      active ? 'bg-emerald-50 text-emerald-800' : 'text-gray-700 hover:bg-gray-50'
    }`;

  const switchRole = async (target: 'visitor' | 'original') => {
    closeMenu();
    try {
      const res = await api.switchMeRole(target);
      setStoredSession(res.tokens);
      await refreshUser();
      navigate(target === 'visitor' ? '/' : accountRouteByRole(res.data.role as Parameters<typeof accountRouteByRole>[0]), { replace: true });
    } catch { /* noop */ }
  };

  if (isAdminRole || isMerchantRole) {
    const roleLabel = isAdminRole ? 'Admin' : 'Merchant';
    const profilePath = isAdminRole ? '/admin/overview' : '/merchant/dashboard';
    return (
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
          aria-label={`${roleLabel} menu`}
          className={`absolute inset-y-0 right-0 w-[min(100vw-3rem,20rem)] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-4 pt-safe-plus-2 pb-4 border-b border-gray-100">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600/90">{roleLabel}</p>
              <p className="text-lg font-bold text-gray-900 truncate">{user?.displayName || 'Account'}</p>
            </div>
            <button type="button" onClick={closeMenu} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100" aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3 pb-safe space-y-1" aria-label={`${roleLabel} navigation`}>
            <Link to={profilePath} onClick={closeMenu} className={navItemClass(pathname.startsWith(profilePath))}>
              <SecureAvatar
                src={user?.avatarUrl}
                name={user?.displayName || user?.email || 'Account'}
                className="w-9 h-9 text-sm"
              />
              <span className="font-semibold">{roleLabel} Dashboard</span>
            </Link>
            <button type="button" onClick={() => void switchRole('visitor')} className={`w-full ${navItemClass(false)}`}>
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100">
                <RefreshCw className="w-5 h-5 text-gray-600" strokeWidth={iconStroke.default} />
              </span>
              <span className="font-semibold">Switch to Visitor</span>
            </button>
            <button type="button" onClick={async () => { closeMenu(); await signOut(); navigate('/signed-out', { replace: true }); }} className={`w-full ${navItemClass(false)}`}>
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100">
                <LogOut className="w-5 h-5 text-gray-600" strokeWidth={iconStroke.default} />
              </span>
              <span className="font-semibold">Sign Out</span>
            </button>
          </nav>
        </aside>
      </div>
    );
  }

  if (isOrganizerRole) {
    return (
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
          aria-label="Organizer menu"
          className={`absolute inset-y-0 right-0 w-[min(100vw-3rem,20rem)] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-4 pt-safe-plus-2 pb-4 border-b border-gray-100">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600/90">Organizer</p>
              <p className="text-lg font-bold text-gray-900 truncate">{user?.displayName || 'Account'}</p>
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
          <nav className="flex-1 overflow-y-auto px-3 py-3 pb-safe space-y-1" aria-label="Organizer navigation">
            <Link
              to="/organizer/profile"
              onClick={closeMenu}
              className={navItemClass(pathname.startsWith('/organizer/profile'))}
            >
              <SecureAvatar
                src={user?.avatarUrl}
                name={user?.displayName || user?.email || 'Account'}
                className="w-9 h-9 text-sm"
              />
              <span className="font-semibold">Organizer Profile</span>
            </Link>
            <button
              type="button"
              onClick={() => void switchRole('visitor')}
              className={`w-full ${navItemClass(false)}`}
            >
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100">
                <RefreshCw className="w-5 h-5 text-gray-600" strokeWidth={iconStroke.default} />
              </span>
              <span className="font-semibold">Switch to Visitor</span>
            </button>
            <button
              type="button"
              onClick={async () => { closeMenu(); await signOut(); navigate('/signed-out', { replace: true }); }}
              className={`w-full ${navItemClass(false)}`}
            >
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100">
                <LogOut className="w-5 h-5 text-gray-600" strokeWidth={iconStroke.default} />
              </span>
              <span className="font-semibold">Sign Out</span>
            </button>
          </nav>
        </aside>
      </div>
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
                navigate('/signed-out', { replace: true });
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
