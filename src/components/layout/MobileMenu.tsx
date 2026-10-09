import { EXPLORE_DISCOVER_BROWSE_PATH, EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { isDiscoverBrowseRoute } from '../../explore/exploreDiscoverBrowse';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Download, LogIn, LogOut, Menu, RefreshCw, User, X } from 'lucide-react';
import { iconStroke, MOBILE_NAV_ICON_MAP } from '../../config/navIcons';
import {
  CONSUMER_HAMBURGER_MENU,
  isConsumerChromeHidden,
  MOBILE_LANDING_USER_MENU,
} from '../../config/platform';
import {
  ANDROID_INSTALL_SETTINGS_HASH,
  IOS_INSTALL_SETTINGS_HASH,
} from '../../config/phoneAppInstall';
import { PROFILE_SETTINGS_PATH } from '../../config/routingCatalog';
import { ADMIN_LINKS, HOST_CONSOLE_LINKS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/index';
import { setStoredSession } from '../../api/client';
import { accountRouteByRole } from '../../utils/authRouting';
import { buildSignInRedirect, signInPathForReturn } from '../../utils/authReturnContext';
import { SecureAvatar } from '../ui/SecureAvatar';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';

export type MobileMenuTone = 'default' | 'light';

/** Above map chrome (1100), below dialogs (1400). Portaled to escape `isolation` on marketing hero. */
const MOBILE_MENU_OVERLAY_Z = 'z-[2000]';

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
  eyebrow?: string;
  title: string;
  ariaLabel: string;
  children: ReactNode;
};

const MobileDrawer = ({ open, closeMenu, eyebrow, title, ariaLabel, children }: MobileDrawerProps) => {
  if (typeof document === 'undefined') return null;

  const overlay = (
    <div
      className={`fixed inset-0 ${MOBILE_MENU_OVERLAY_Z} transition-opacity duration-200 ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={closeMenu}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`absolute inset-y-0 right-0 flex w-[min(100vw-3rem,20rem)] max-w-full flex-col border-l border-neutral-100 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 pb-4 pt-safe-plus-2">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600/90">{eyebrow}</p>
            ) : null}
            <p className="truncate text-lg font-bold text-gray-900">{title}</p>
          </div>
          <button
            type="button"
            onClick={closeMenu}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3 pb-safe" aria-label={ariaLabel}>
          <div className="space-y-0.5">{children}</div>
        </nav>
      </aside>
    </div>
  );

  return createPortal(overlay, document.body);
};

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
  const toneClass =
    tone === 'light'
      ? 'text-white bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25'
      : 'text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100';

  return (
    <button
      type="button"
      onClick={openMenu}
      className={`${showOnDesktop ? '' : 'md:hidden'} h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full transition-colors active:scale-95 ${toneClass} ${className}`}
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" strokeWidth={2.25} />
    </button>
  );
};

/** Landing hero — user icon opens Explore · Join · Contact only (no hamburger). */
export const MobileUserMenuButton = ({
  tone = 'default',
  className = '',
  showOnDesktop = false,
}: MobileMenuButtonProps) => {
  const [open, setOpen] = useState(false);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toneClass =
    tone === 'light'
      ? 'text-white bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25'
      : 'text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100';

  useEffect(() => {
    setOpen(false);
  }, [pathname, search]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  const isActive = (match: readonly string[]) =>
    match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${showOnDesktop ? '' : 'md:hidden'} relative h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full transition-colors active:scale-95 overflow-hidden ${toneClass} ${className}`}
        aria-label="Open account menu"
      >
        {user ? (
          <SecureAvatar
            src={user.avatarUrl}
            name={user.displayName || user.email || 'Account'}
            className="h-full w-full text-sm"
          />
        ) : (
          <User className="w-5 h-5" strokeWidth={2.25} />
        )}
      </button>

      <MobileDrawer
        open={open}
        closeMenu={closeMenu}
        eyebrow="Menu"
        title={user?.displayName || 'UAE Trail'}
        ariaLabel="Landing navigation"
      >
        {!user ? (
          <Link
            to={signInPathForReturn(EXPLORE_MAP_PATH)}
            onClick={closeMenu}
            className={navItemClass(pathname.startsWith('/signin'))}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
              <LogIn className="h-5 w-5 text-gray-600" strokeWidth={iconStroke.default} />
            </span>
            <span className="font-semibold">Log in</span>
          </Link>
        ) : null}
        {MOBILE_LANDING_USER_MENU.map((item) => {
          const active =
            'match' in item && item.label === 'Browse'
              ? isDiscoverBrowseRoute(pathname, search)
              : 'match' in item && item.label === 'Explore'
                ? (pathname === EXPLORE_MAP_PATH || pathname === '/discovery') &&
                  !isDiscoverBrowseRoute(pathname, search)
                : 'match' in item
                  ? isActive(item.match)
                  : false;
          const Icon = MOBILE_NAV_ICON_MAP[item.label] ?? User;
          const content = (
            <>
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
              <span className="font-semibold">{item.label}</span>
            </>
          );

          if ('href' in item) {
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className={navItemClass(false)}
              >
                {content}
              </a>
            );
          }

          if (item.to === EXPLORE_MAP_PATH) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  closeMenu();
                  navigate(EXPLORE_MAP_PATH);
                }}
                className={`w-full ${navItemClass(active)}`}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={closeMenu}
              className={navItemClass(active)}
              aria-current={active ? 'page' : undefined}
            >
              {content}
            </Link>
          );
        })}
      </MobileDrawer>
    </>
  );
};

const MobileMenuPanel = () => {
  const { open, closeMenu } = useMobileMenu();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { user, signOut, refreshUser } = useAuth();
  const unreadNotifications = useNotificationUnreadCount();
  const { href: signInHref } = buildSignInRedirect({ pathname, search });

  const isHostConsoleRole =
    user?.role === 'tenant_owner' || user?.role === 'tenant_admin' || user?.role === 'tenant_guide';
  const isAdminRole = user?.role === 'platform_admin';
  const isPrivilegedRole = isHostConsoleRole || isAdminRole;
  const onAdminConsole = pathname.startsWith('/admin');
  const onHostConsole = pathname.startsWith('/host') || pathname.startsWith('/organizer');
  const canSwitchBack = user?.role === 'participant' && Boolean(user?.switchedFromRole);

  // Console shells use dashboard drawers; consumer map/browse always use CONSUMER_HAMBURGER_MENU.
  if (isConsumerChromeHidden(pathname) && !isPrivilegedRole) return null;

  const profileDestination = user ? accountRouteByRole(user.role) : signInHref;

  const isActive = (match: readonly string[]) =>
    match.some((prefix) =>
      prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

  const openPwaInstall = (action: 'pwa-android' | 'pwa-ios') => {
    closeMenu();
    const hash = action === 'pwa-ios' ? IOS_INSTALL_SETTINGS_HASH : ANDROID_INSTALL_SETTINGS_HASH;
    navigate(`${PROFILE_SETTINGS_PATH}${hash}`);
  };

  const switchRole = async (target: 'participant' | 'original') => {
    closeMenu();
    try {
      const res = await api.switchMeRole(target);
      setStoredSession(res.tokens);
      await refreshUser();
      navigate(target === 'participant' ? EXPLORE_MAP_PATH : accountRouteByRole(res.data.role as Parameters<typeof accountRouteByRole>[0]), { replace: true });
    } catch { /* noop */ }
  };

  if (isAdminRole && onAdminConsole) {
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

  if (isHostConsoleRole && onHostConsole) {
    return (
      <MobileDrawer
        open={open}
        closeMenu={closeMenu}
        eyebrow="Organise"
        title={user?.displayName || 'Account'}
        ariaLabel="Host console navigation"
      >
        <DashboardDrawerLinks links={HOST_CONSOLE_LINKS} pathname={pathname} closeMenu={closeMenu} />
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
    <MobileDrawer open={open} closeMenu={closeMenu} title="UAE Trail" ariaLabel="Main menu">
      {CONSUMER_HAMBURGER_MENU.map((item) => {
            if (item.kind === 'download') {
              return (
                <div key={item.title} className="mt-2 border-t border-neutral-100 pt-2" role="group" aria-label={item.title}>
                  <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                    {item.title}
                  </p>
                  {item.items.map((sub) => {
                    const isAndroid = sub.action === 'pwa-android';
                    return (
                      <button
                        key={sub.label}
                        type="button"
                        onClick={() => openPwaInstall(sub.action)}
                        className={`w-full ${navItemClass(false)}`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${
                            isAndroid ? 'bg-emerald-50' : 'bg-sky-50'
                          }`}
                          aria-hidden
                        >
                          {sub.emoji}
                        </span>
                        <span className="min-w-0 flex-1 text-left font-semibold">{sub.label}</span>
                        <Download
                          className={`h-4 w-4 shrink-0 ${isAndroid ? 'text-emerald-600' : 'text-sky-600'}`}
                          strokeWidth={2.25}
                          aria-hidden
                        />
                      </button>
                    );
                  })}
                </div>
              );
            }

            const active =
              item.to === EXPLORE_DISCOVER_BROWSE_PATH
                ? isDiscoverBrowseRoute(pathname, search)
                : isActive(item.match);
            const label = user || !item.labelGuest ? item.label : item.labelGuest;
            const emoji = user || !item.emojiGuest ? item.emoji : item.emojiGuest;
            const destination = item.profileLink ? (user ? profileDestination : signInHref) : item.to;
            return (
              <Link
                key={item.label}
                to={destination}
                onClick={closeMenu}
                className={navItemClass(active)}
                aria-current={active ? 'page' : undefined}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${
                    active ? 'bg-emerald-600/12' : 'bg-gray-100'
                  }`}
                  aria-hidden
                >
                  {emoji}
                </span>
                <span className="font-semibold">{label}</span>
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
              }}
              className={`w-full ${navItemClass(false)}`}
            >
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100">
                <LogOut className="w-5 h-5 text-gray-600" strokeWidth={iconStroke.default} />
              </span>
              <span className="font-semibold">Sign Out</span>
            </button>
          ) : null}
    </MobileDrawer>
  );
};
