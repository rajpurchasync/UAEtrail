import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { MEMBER_HOME_PATH } from '../../config/surfacePaths';
import { isDiscoverBrowseRoute } from '@/discovery/discoveryPortExploreRouting';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Download,
  LogIn,
  LogOut,
  RefreshCw,
  Shield,
  Smartphone,
  Tablet,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { iconStroke, MOBILE_NAV_ICON_MAP } from '../../config/navIcons';
import { UiTooltip } from '../ui/UiTooltip';
import {
  CONSUMER_HAMBURGER_MENU,
  isConsumerChromeHidden,
  LIST_DISCOVERY_PATH,
  MOBILE_LANDING_USER_MENU,
  type ConsumerHamburgerMenuItem,
} from '../../config/platform';
import {
  ANDROID_INSTALL_SETTINGS_HASH,
  IOS_INSTALL_SETTINGS_HASH,
} from '../../config/phoneAppInstall';
import { detectAndroidWebBrowser, resolveAndroidInstallSteps, resolveIosInstallSteps } from '../../utils/pwaInstallGuide';
import { promptAndroidInstall } from '../../utils/pwaInstallPrompt';
import { APP_SETTINGS_PATH } from '../../config/routingCatalog';
import { MESSAGES_PATH, PLAN_PATH } from '../../config/surfacePaths';
import { resolveMobileTabHeaderTitle } from '../../config/mobileTabHeader';
import { exploreMapMobileBackState, mobileBackNavState, type MobileBackNavState } from '../../utils/mobileBackNav';
import { isOperatorConsolePath } from '../../config/surfacePaths';
import { ADMIN_LINKS } from '../../constants';
import { operatorDeskNavLinksForKind } from '../../operator/desk/modules';
import { useActiveOperatorDeskKind } from '../../operator/desk/useActiveOperatorDeskKind';
import { ADMIN_OVERVIEW_PATH } from '../../config/adminSurfacePaths';
import { isAdminConsoleNavActive } from '../../admin/adminNavActive';
import { useAuth } from '../../context/AuthContext';
import { persistAuthSessionTokens, switchMeRoleSession } from '../../hooks/accountSessionApi';
import { accountRouteByRole } from '../../utils/authRouting';
import { buildSignInRedirect, signInPathForReturn } from '../../utils/authReturnContext';
import {
  mobileFiveTabHomePath,
  resolveMobileFiveTab,
  type MobileFiveTabId,
} from '../../config/mobileFiveTabNav';

const HAMBURGER_FIVE_TAB_BY_LABEL: Record<string, MobileFiveTabId> = {
  Trips: 'trips',
  Places: 'venues',
  Plans: 'plan',
  Crews: 'crews',
  /** @deprecated Legacy hamburger label */
  People: 'crews',
};

type ConsumerHamburgerLinkItem = Extract<ConsumerHamburgerMenuItem, { kind: 'link' }>;

const isConsumerHamburgerLinkActive = (
  item: ConsumerHamburgerLinkItem,
  pathname: string,
  search: string
): boolean => {
  const activeTab = resolveMobileFiveTab(pathname, search);
  if (item.label === 'Trips') {
    if (pathname === LIST_DISCOVERY_PATH && activeTab === 'trips') return true;
    if (pathname === EXPLORE_MAP_PATH && activeTab === 'trips') {
      const params = new URLSearchParams(search);
      if (params.get('list') !== '1' && !isDiscoverBrowseRoute(pathname, search)) return true;
    }
    return isDiscoverBrowseRoute(pathname, search) && activeTab === 'trips';
  }
  if (item.label === 'Places') {
    if (pathname === LIST_DISCOVERY_PATH && activeTab === 'venues') return true;
    return pathname === EXPLORE_MAP_PATH && activeTab === 'venues';
  }
  if (item.label === 'Crews' || item.label === 'People') {
    if (pathname === LIST_DISCOVERY_PATH && activeTab === 'crews') return true;
    return (
      pathname === EXPLORE_MAP_PATH && activeTab === 'crews'
    );
  }
  if (item.label === 'Chat') {
    if (pathname !== MESSAGES_PATH && pathname !== '/operator/messages') return false;
    const params = new URLSearchParams(search.replace(/^\?/, ''));
    if (params.get('to') || params.get('group')) return false;
    return true;
  }
  if (item.label === 'Plans') {
    return pathname === PLAN_PATH || pathname.startsWith(`${PLAN_PATH}/`);
  }
  return item.match.some((prefix) =>
    prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
};

const isMobileLandingUserMenuItemActive = (
  item: (typeof MOBILE_LANDING_USER_MENU)[number],
  pathname: string,
  search: string
): boolean => {
  const activeTab = resolveMobileFiveTab(pathname, search);
  if (item.label === 'Trips') {
    if (pathname === LIST_DISCOVERY_PATH && activeTab === 'trips') return true;
    if (pathname === EXPLORE_MAP_PATH && activeTab === 'trips') {
      const params = new URLSearchParams(search);
      if (params.get('list') !== '1' && !isDiscoverBrowseRoute(pathname, search)) return true;
    }
    return isDiscoverBrowseRoute(pathname, search) && activeTab === 'trips';
  }
  if (item.label === 'Places') {
    if (pathname === LIST_DISCOVERY_PATH && activeTab === 'venues') return true;
    return pathname === EXPLORE_MAP_PATH && activeTab === 'venues';
  }
  if (item.label === 'Explore') {
    return (
      pathname === EXPLORE_MAP_PATH && !isDiscoverBrowseRoute(pathname, search)
    );
  }
  if ('match' in item) {
    return (item.match as readonly string[]).some((prefix) =>
      prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  }
  return false;
};

const resolveConsumerHamburgerDestination = (
  item: ConsumerHamburgerLinkItem,
  user: { id: string } | null,
  profileDestination: string,
  signInHref: string
): string => {
  if (item.profileLink) return user ? profileDestination : signInHref;
  if (item.authGate && !user) return item.to;
  const fiveTab = HAMBURGER_FIVE_TAB_BY_LABEL[item.label];
  if (fiveTab) return mobileFiveTabHomePath(fiveTab);
  return item.to;
};

/** Plan opened from explore menu — header back returns to map, not profile in history stack. */
const resolveConsumerHamburgerLinkState = (
  item: ConsumerHamburgerLinkItem,
  pathname: string,
  search: string
): MobileBackNavState | undefined => {
  if (item.label !== 'Plans' && item.label !== 'My Plans') return undefined;
  const onExplore =
    pathname === EXPLORE_MAP_PATH ||
    pathname === LIST_DISCOVERY_PATH ||
    isDiscoverBrowseRoute(pathname, search);
  if (!onExplore) return undefined;
  const returnTo = search ? `${pathname}?${search}` : pathname;
  return exploreMapMobileBackState(returnTo);
};
import {
  MOBILE_CONSUMER_MENU_Z,
  MOBILE_DRAWER,
  mobileDrawerIconTone,
  mobileDrawerIconWell,
  mobileDrawerRowClass,
} from './mobileDrawerChrome';
import { UaeTrailBrandMark } from './UaeTrailBrandMark';
import { SecureAvatar } from '../ui/SecureAvatar';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { DisplayPreferencesSection } from '../profile/DisplayPreferencesSection';
import { syncConsumerMobileHeaderStack } from './syncConsumerMobileHeaderStack';

export type MobileMenuTone = 'default' | 'light';

const MOBILE_MENU_OVERLAY_Z = MOBILE_CONSUMER_MENU_Z.overlay;

/** Drawer + dimmer top — measured on open; fallback matches `index.css`. */
const MOBILE_MENU_TOP_INSET =
  'top-[var(--consumer-mobile-header-stack,calc(var(--safe-top,0px)+3.75rem))]';

const AnimatedBurgerIcon = ({ open }: { open: boolean }) => (
  <svg
    width={20}
    height={16}
    viewBox="0 0 20 16"
    fill="none"
    aria-hidden
    className="block shrink-0 overflow-visible"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="butt"
    strokeLinejoin="miter"
  >
    <line
      x1="2"
      y1="3"
      x2="18"
      y2="3"
      className="transition-transform duration-300 ease-out"
      style={{
        transformBox: 'view-box',
        transformOrigin: '10px 3px',
        transform: open ? 'translateY(5px) rotate(45deg)' : 'none',
      }}
    />
    <line
      x1="2"
      y1="8"
      x2="18"
      y2="8"
      className="transition-opacity duration-200"
      style={{ opacity: open ? 0 : 1 }}
    />
    <line
      x1="2"
      y1="13"
      x2="18"
      y2="13"
      className="transition-transform duration-300 ease-out"
      style={{
        transformBox: 'view-box',
        transformOrigin: '10px 13px',
        transform: open ? 'translateY(-5px) rotate(-45deg)' : 'none',
      }}
    />
  </svg>
);

type DashboardNavLink = { to: string; label: string };

interface MobileMenuContextValue {
  open: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

interface MobileMenuProviderProps {
  children: ReactNode;
}

const DrawerNavIcon = ({ active, icon: Icon }: { active: boolean; icon: LucideIcon }) => (
  <span className={mobileDrawerIconWell(active)} aria-hidden>
    <Icon
      className={`h-4 w-4 ${mobileDrawerIconTone(active)}`}
      strokeWidth={active ? iconStroke.active : iconStroke.default}
    />
  </span>
);

const drawerNavLabelClass = (active: boolean) =>
  `${MOBILE_DRAWER.label} ${active ? MOBILE_DRAWER.labelActive : ''}`;

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

type MobileDrawerHeader = {
  /** Consumer hub — close control only (identity row stays in the tab header). */
  closeOnly?: boolean;
  eyebrow?: string;
  title?: string;
  /** Show gradient logo + wordmark (guest landing / consoles without app brand chrome). */
  showBrandMark?: boolean;
};

type MobileDrawerProps = {
  open: boolean;
  closeMenu: () => void;
  ariaLabel: string;
  children: ReactNode;
  /** In-panel title + close, or {@link MobileDrawerHeader.closeOnly} on consumer tabs. */
  header?: MobileDrawerHeader;
};

const MobileDrawer = ({
  open,
  closeMenu,
  ariaLabel,
  children,
  header,
}: MobileDrawerProps) => {
  if (typeof document === 'undefined') return null;

  const overlay = (
    <div
      className={`fixed inset-0 ${MOBILE_MENU_OVERLAY_Z} pointer-events-none transition-opacity duration-200 ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <button
        type="button"
        className={`absolute inset-x-0 bottom-0 ${MOBILE_MENU_TOP_INSET} bg-black/50 backdrop-blur-[2px] ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={closeMenu}
      />
      <aside
        data-mobile-drawer
        role={open ? 'dialog' : undefined}
        aria-modal={open ? true : undefined}
        aria-label={open ? ariaLabel : undefined}
        {...(!open ? { inert: true as const } : {})}
        className={`${MOBILE_DRAWER.aside} ${open ? 'pointer-events-auto translate-x-0' : 'pointer-events-none translate-x-full'}`}
      >
        {header ? (
          header.closeOnly ? (
            <div className="flex shrink-0 items-center justify-end border-b border-neutral-200/80 bg-white/95 px-2 py-1 backdrop-blur-sm">
              <button
                type="button"
                onClick={closeMenu}
                className={MOBILE_DRAWER.closeBtn}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200/80 bg-white/95 px-3 py-2 backdrop-blur-sm">
              <div className="min-w-0">
                {header.eyebrow ? (
                  <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600/90">
                    {header.eyebrow}
                  </p>
                ) : null}
                {header.showBrandMark ? (
                  <UaeTrailBrandMark size="md" />
                ) : (
                  <p className="truncate text-lg font-semibold text-neutral-900">{header.title}</p>
                )}
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className={MOBILE_DRAWER.closeBtn}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )
        ) : null}
        <nav className={MOBILE_DRAWER.nav} aria-label={ariaLabel}>
          {children}
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
  adminNav = false,
}: {
  links: readonly DashboardNavLink[];
  pathname: string;
  closeMenu: () => void;
  adminNav?: boolean;
}) => (
  <>
    {links.map((link) => {
      const active = adminNav ? isAdminConsoleNavActive(pathname, link.to) : isPathActive(pathname, link.to);
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
  const menuTriggerFocusRef = useRef<HTMLElement | null>(null);

  const rememberMenuTrigger = useCallback(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      menuTriggerFocusRef.current = active;
    }
  }, []);

  const restoreMenuFocus = useCallback(() => {
    const trigger = menuTriggerFocusRef.current;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest('[data-mobile-drawer]')) {
      if (trigger && document.contains(trigger)) {
        try {
          trigger.focus({ preventScroll: true });
          return;
        } catch {
          /* trigger unmounted */
        }
      }
      active.blur();
    }
  }, []);

  const closeMenu = useCallback(() => {
    restoreMenuFocus();
    setOpen(false);
  }, [restoreMenuFocus]);

  const openMenu = useCallback(() => {
    rememberMenuTrigger();
    setOpen(true);
  }, [rememberMenuTrigger]);

  const toggleMenu = useCallback(() => {
    setOpen((current) => {
      if (current) {
        restoreMenuFocus();
        return false;
      }
      rememberMenuTrigger();
      return true;
    });
  }, [rememberMenuTrigger, restoreMenuFocus]);

  useEffect(() => {
    document.documentElement.dataset.mobileMenu = open ? 'open' : '';
    return () => {
      delete document.documentElement.dataset.mobileMenu;
    };
  }, [open]);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useLayoutEffect(() => {
    if (!open) return;
    const sync = () => syncConsumerMobileHeaderStack();
    sync();
    const raf = requestAnimationFrame(sync);
    window.addEventListener('resize', sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', sync);
    };
  }, [open, pathname]);

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
    <MobileMenuContext.Provider value={{ open, openMenu, closeMenu, toggleMenu }}>
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

export const useMobileMenuOpen = (): boolean => useContext(MobileMenuContext)?.open ?? false;

export const MobileMenuButton = ({ tone = 'default', className = '', showOnDesktop = false }: MobileMenuButtonProps) => {
  const { open, toggleMenu } = useMobileMenu();
  const toneClass =
    tone === 'light'
      ? 'text-white bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25'
      : 'text-neutral-600 bg-transparent border border-transparent hover:bg-neutral-100 hover:text-neutral-900';

  return (
    <UiTooltip label={open ? 'Close menu' : 'Menu'}>
    <button
      type="button"
      onClick={toggleMenu}
      className={`${showOnDesktop ? '' : 'md:hidden'} relative ${MOBILE_CONSUMER_MENU_Z.menuButton} h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-full transition-colors active:scale-95 ${toneClass} ${className}`}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
    >
      <AnimatedBurgerIcon open={open} />
    </button>
    </UiTooltip>
  );
};

/** Landing hero — user icon opens Explore · Join · Contact only (no hamburger). */
export const MobileUserMenuButton = ({
  tone = 'default',
  className = '',
  showOnDesktop = false,
}: MobileMenuButtonProps) => {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toneClass =
    tone === 'light'
      ? 'text-white bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25'
      : 'text-neutral-600 bg-transparent border border-transparent hover:bg-neutral-100 hover:text-neutral-900';

  const closeLandingMenu = useCallback(() => {
    try {
      menuButtonRef.current?.focus({ preventScroll: true });
    } catch {
      /* noop */
    }
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest('[data-mobile-drawer]')) {
      active.blur();
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    closeLandingMenu();
  }, [pathname, search, closeLandingMenu]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLandingMenu();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, closeLandingMenu]);

  const closeMenu = closeLandingMenu;

  return (
    <>
      <button
        ref={menuButtonRef}
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
        ariaLabel="Landing navigation"
        header={{
          eyebrow: user ? 'Menu' : undefined,
          title: user?.displayName || 'UAE Trail',
          showBrandMark: !user,
        }}
      >
        <div className={MOBILE_DRAWER.stack}>
          <div className={MOBILE_DRAWER.group}>
            {!user ? (
              <Link
                to={signInPathForReturn(EXPLORE_MAP_PATH)}
                onClick={closeMenu}
                className={mobileDrawerRowClass(pathname.startsWith('/signin'))}
              >
                <DrawerNavIcon active={pathname.startsWith('/signin')} icon={LogIn} />
                <span className={drawerNavLabelClass(pathname.startsWith('/signin'))}>Log in</span>
              </Link>
            ) : null}
            {MOBILE_LANDING_USER_MENU.map((item) => {
              const active = isMobileLandingUserMenuItemActive(item, pathname, search);
              const Icon = MOBILE_NAV_ICON_MAP[item.label] ?? User;

              if ('href' in item) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={closeMenu}
                    className={mobileDrawerRowClass(false)}
                  >
                    <DrawerNavIcon active={false} icon={Icon} />
                    <span className={drawerNavLabelClass(false)}>{item.label}</span>
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
                    className={mobileDrawerRowClass(active)}
                  >
                    <DrawerNavIcon active={active} icon={Icon} />
                    <span className={drawerNavLabelClass(active)}>{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={closeMenu}
                  className={mobileDrawerRowClass(active)}
                  aria-current={active ? 'page' : undefined}
                >
                  <DrawerNavIcon active={active} icon={Icon} />
                  <span className={drawerNavLabelClass(active)}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </MobileDrawer>
    </>
  );
};

const MobileMenuPanel = () => {
  const { open, closeMenu } = useMobileMenu();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { user, signOut, refreshUser } = useAuth();
  const { canAccessOperatorWorkspace } = useMemberStatus({ enabled: Boolean(user) });
  const deskKind = useActiveOperatorDeskKind();
  const operatorConsoleLinks = useMemo(
    () => operatorDeskNavLinksForKind(deskKind).map(({ to, label }) => ({ to, label })),
    [deskKind]
  );
  const unreadNotifications = useNotificationUnreadCount();
  const { href: signInHref } = buildSignInRedirect({ pathname, search });
  const [androidHelpOpen, setAndroidHelpOpen] = useState(false);
  const [iosHelpOpen, setIosHelpOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setAndroidHelpOpen(false);
      setIosHelpOpen(false);
    }
  }, [open]);

  const isAdminRole = user?.role === 'platform_admin';
  const isPrivilegedRole = canAccessOperatorWorkspace || isAdminRole;
  const onAdminConsole = pathname.startsWith('/admin');
  const onPublishingConsole = isOperatorConsolePath(pathname);
  const canSwitchBack = user?.role === 'participant' && Boolean(user?.switchedFromRole);

  // Console shells use dashboard drawers; consumer map/browse always use CONSUMER_HAMBURGER_MENU.
  if (isConsumerChromeHidden(pathname) && !isPrivilegedRole) return null;

  const profileDestination = user ? accountRouteByRole(user.role) : signInHref;

  const openPwaInstall = (action: 'pwa-android' | 'pwa-ios') => {
    closeMenu();
    const hash = action === 'pwa-ios' ? IOS_INSTALL_SETTINGS_HASH : ANDROID_INSTALL_SETTINGS_HASH;
    const from = search ? `${pathname}${search}` : pathname;
    const label = resolveMobileTabHeaderTitle(pathname, search) ?? 'Back';
    navigate(`${APP_SETTINGS_PATH}${hash}`, {
      state: mobileBackNavState(from, label),
    });
  };

  const switchRole = async (target: 'participant' | 'original') => {
    closeMenu();
    try {
      const res = await switchMeRoleSession(target);
      persistAuthSessionTokens(res.tokens);
      await refreshUser();
      navigate(target === 'participant' ? MEMBER_HOME_PATH : accountRouteByRole(res.data.role as Parameters<typeof accountRouteByRole>[0]), { replace: true });
    } catch { /* noop */ }
  };

  if (isAdminRole && onAdminConsole) {
    return (
      <MobileDrawer
        open={open}
        closeMenu={closeMenu}
        ariaLabel="Admin navigation"
        header={{ eyebrow: 'Admin', title: user?.displayName || 'Account' }}
      >
        <DashboardDrawerLinks links={ADMIN_LINKS} pathname={pathname} closeMenu={closeMenu} adminNav />
        <Link
          to="/admin/notifications"
          onClick={closeMenu}
          className={`${dashboardLinkClass(isAdminConsoleNavActive(pathname, '/admin/notifications'))} flex items-center justify-between gap-2`}
        >
          <span>Notifications</span>
          {unreadNotifications > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </span>
          )}
        </Link>
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

  if (canAccessOperatorWorkspace && onPublishingConsole) {
    return (
      <MobileDrawer
        open={open}
        closeMenu={closeMenu}
        ariaLabel="Workspace navigation"
        header={{ eyebrow: 'Organise', title: user?.displayName || 'Account' }}
      >
        <DashboardDrawerLinks links={operatorConsoleLinks} pathname={pathname} closeMenu={closeMenu} />
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
    <MobileDrawer open={open} closeMenu={closeMenu} ariaLabel="Main menu">
      <div className={MOBILE_DRAWER.menuStack}>
        <DisplayPreferencesSection compact themeOnly />

        <div aria-labelledby="hamburger-actions">
          <p id="hamburger-actions" className={MOBILE_DRAWER.sectionLabel}>
            Actions
          </p>
          <div className={MOBILE_DRAWER.group}>
          {CONSUMER_HAMBURGER_MENU.filter((item) => item.kind === 'link').map((item) => {
            const linkItem = item as ConsumerHamburgerLinkItem;
            const active = isConsumerHamburgerLinkActive(linkItem, pathname, search);
            const label = linkItem.label;
            const iconKey = linkItem.label;
            const Icon = MOBILE_NAV_ICON_MAP[iconKey as keyof typeof MOBILE_NAV_ICON_MAP] ?? User;
            const destination = resolveConsumerHamburgerDestination(
              linkItem,
              user,
              profileDestination,
              signInHref
            );
            const linkState = resolveConsumerHamburgerLinkState(linkItem, pathname, search);
            return (
              <Link
                key={item.label}
                to={destination}
                state={linkState}
                onClick={closeMenu}
                className={mobileDrawerRowClass(active)}
                aria-current={active ? 'page' : undefined}
              >
                <DrawerNavIcon active={active} icon={Icon} />
                <span className={drawerNavLabelClass(active)}>{label}</span>
              </Link>
            );
          })}
          </div>
        </div>

        {CONSUMER_HAMBURGER_MENU.filter((item) => item.kind === 'download').map((item) => (
          <div key={item.title} role="group" aria-label={item.title}>
            <p className={MOBILE_DRAWER.sectionLabel}>{item.title}</p>
            <div className={MOBILE_DRAWER.group}>
              {item.items.map((sub) => {
                const PlatformIcon = sub.action === 'pwa-android' ? Smartphone : Tablet;
                const androidGuide =
                  sub.action === 'pwa-android'
                    ? resolveAndroidInstallSteps(detectAndroidWebBrowser(), window.isSecureContext)
                    : null;
                const iosSteps =
                  sub.action === 'pwa-ios' ? resolveIosInstallSteps() : null;
                return (
                  <div key={sub.label}>
                    <button
                      type="button"
                      onClick={() => {
                        if (sub.action === 'pwa-android') {
                          if (androidHelpOpen) {
                            setAndroidHelpOpen(false);
                            return;
                          }
                          setIosHelpOpen(false);
                          if (promptAndroidInstall()) {
                            closeMenu();
                            return;
                          }
                          if (user) {
                            openPwaInstall('pwa-android');
                            return;
                          }
                          setAndroidHelpOpen(true);
                          return;
                        }
                        if (sub.action === 'pwa-ios') {
                          if (iosHelpOpen) {
                            setIosHelpOpen(false);
                            return;
                          }
                          setAndroidHelpOpen(false);
                          if (user) {
                            openPwaInstall('pwa-ios');
                            return;
                          }
                          setIosHelpOpen(true);
                          return;
                        }
                      }}
                      className={mobileDrawerRowClass(false)}
                    >
                      <DrawerNavIcon active={false} icon={PlatformIcon} />
                      <span className={`min-w-0 flex-1 ${drawerNavLabelClass(false)}`}>{sub.label}</span>
                      <Download className="h-4 w-4 shrink-0 text-emerald-700/70" strokeWidth={2.25} aria-hidden />
                    </button>
                    {sub.action === 'pwa-android' && androidHelpOpen && androidGuide ? (
                      <div className="px-4 pb-3 text-xs leading-relaxed text-neutral-600">
                        {androidGuide.notice ? <p>{androidGuide.notice}</p> : null}
                        <ol className="mt-2 list-decimal space-y-1 pl-4">
                          {androidGuide.steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                    {sub.action === 'pwa-ios' && iosHelpOpen && iosSteps ? (
                      <div className="px-4 pb-3 text-xs leading-relaxed text-neutral-600">
                        <ol className="list-decimal space-y-1 pl-4">
                          {iosSteps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {isAdminRole && !onAdminConsole ? (
          <div role="group" aria-label="Platform admin">
            <p className={MOBILE_DRAWER.sectionLabel}>Platform</p>
            <div className={MOBILE_DRAWER.group}>
              <Link
                to={ADMIN_OVERVIEW_PATH}
                onClick={closeMenu}
                className={mobileDrawerRowClass(false)}
              >
                <DrawerNavIcon active={false} icon={Shield} />
                <span className={drawerNavLabelClass(false)}>Admin console</span>
              </Link>
            </div>
          </div>
        ) : null}

        <div className={MOBILE_DRAWER.group}>
          {canSwitchBack ? (
            <button
              type="button"
              onClick={() => void switchRole('original')}
              className={mobileDrawerRowClass(false)}
            >
              <DrawerNavIcon active={false} icon={RefreshCw} />
              <span className={`${drawerNavLabelClass(false)} text-emerald-800`}>
                {user?.switchedFromRole === 'platform_admin'
                  ? 'Switch to admin'
                  : `Restore ${user?.switchedFromRole?.replace(/_/g, ' ')}`}
              </span>
            </button>
          ) : null}
          {user ? (
            <button
              type="button"
              onClick={async () => {
                closeMenu();
                await signOut();
              }}
              className={mobileDrawerRowClass(false)}
            >
              <DrawerNavIcon active={false} icon={LogOut} />
              <span className={drawerNavLabelClass(false)}>Sign out</span>
            </button>
          ) : (
            <Link
              to={signInHref}
              onClick={closeMenu}
              className={mobileDrawerRowClass(pathname.startsWith('/signin'))}
            >
              <DrawerNavIcon active={pathname.startsWith('/signin')} icon={LogIn} />
              <span className={drawerNavLabelClass(pathname.startsWith('/signin'))}>Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </MobileDrawer>
  );
};
