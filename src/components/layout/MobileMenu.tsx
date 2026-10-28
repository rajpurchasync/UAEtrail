import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { isDiscoverBrowseRoute } from '../../explore/exploreDiscoverBrowse';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Download,
  LogIn,
  LogOut,
  Menu,
  RefreshCw,
  Smartphone,
  Tablet,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { iconStroke, MOBILE_NAV_ICON_MAP } from '../../config/navIcons';
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
import { PROFILE_SETTINGS_PATH } from '../../config/routingCatalog';
import { resolveMobileTabHeaderTitle } from '../../config/mobileTabHeader';
import { exploreMapMobileBackState, mobileBackNavState, type MobileBackNavState } from '../../utils/mobileBackNav';
import { isPublishingConsolePath } from '../../config/surfacePaths';
import { ADMIN_LINKS, PUBLISHING_CONSOLE_LINKS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { persistAuthSessionTokens, switchMeRoleSession } from '../../hooks/accountSessionApi';
import { accountRouteByRole } from '../../utils/authRouting';
import { buildSignInRedirect, signInPathForReturn } from '../../utils/authReturnContext';

type ConsumerHamburgerLinkItem = Extract<ConsumerHamburgerMenuItem, { kind: 'link' }>;

const isConsumerHamburgerLinkActive = (
  item: ConsumerHamburgerLinkItem,
  pathname: string,
  search: string
): boolean => {
  if (item.label === 'Explore') {
    const params = new URLSearchParams(search);
    return (
      (pathname === EXPLORE_MAP_PATH || pathname === '/discovery') &&
      !isDiscoverBrowseRoute(pathname, search) &&
      params.get('list') !== '1'
    );
  }
  if (item.label === 'Browse') {
    return isDiscoverBrowseRoute(pathname, search) || pathname === LIST_DISCOVERY_PATH;
  }
  return item.match.some((prefix) =>
    prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
};

const resolveConsumerHamburgerDestination = (
  item: ConsumerHamburgerLinkItem,
  user: { id: string } | null,
  profileDestination: string,
  signInHref: string
): string => {
  if (item.profileLink) return user ? profileDestination : signInHref;
  if (item.authGate && !user) return signInPathForReturn(item.to);
  return item.to;
};

/** Plan opened from explore menu — header back returns to map, not profile in history stack. */
const resolveConsumerHamburgerLinkState = (
  item: ConsumerHamburgerLinkItem,
  pathname: string,
  search: string
): MobileBackNavState | undefined => {
  if (item.label !== 'My Plans') return undefined;
  const onExplore =
    pathname === EXPLORE_MAP_PATH ||
    pathname === '/discovery' ||
    pathname === LIST_DISCOVERY_PATH ||
    isDiscoverBrowseRoute(pathname, search);
  if (!onExplore) return undefined;
  const returnTo = search ? `${pathname}?${search}` : pathname;
  return exploreMapMobileBackState(returnTo);
};
import {
  MOBILE_DRAWER,
  mobileDrawerIconTone,
  mobileDrawerIconWell,
  mobileDrawerRowClass,
} from './mobileDrawerChrome';
import { UaeTrailBrandMark } from './UaeTrailBrandMark';
import { SecureAvatar } from '../ui/SecureAvatar';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';
import { useMemberStatus } from '../../hooks/useMemberStatus';

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

const DrawerNavIcon = ({ active, icon: Icon }: { active: boolean; icon: LucideIcon }) => (
  <span className={mobileDrawerIconWell(active)} aria-hidden>
    <Icon
      className={`h-[18px] w-[18px] ${mobileDrawerIconTone(active)}`}
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

type MobileDrawerProps = {
  open: boolean;
  closeMenu: () => void;
  eyebrow?: string;
  title: string;
  /** Show gradient logo + wordmark (consumer menu / guest landing). */
  showBrandMark?: boolean;
  ariaLabel: string;
  children: ReactNode;
};

const MobileDrawer = ({
  open,
  closeMenu,
  eyebrow,
  title,
  showBrandMark = false,
  ariaLabel,
  children,
}: MobileDrawerProps) => {
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
        className={`${MOBILE_DRAWER.aside} ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200/80 bg-white/95 px-4 pb-3 pt-safe-plus-2 backdrop-blur-sm">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600/90">
                {eyebrow}
              </p>
            ) : null}
            {showBrandMark ? (
              <UaeTrailBrandMark size="md" />
            ) : (
              <p className="truncate text-lg font-semibold text-neutral-900">{title}</p>
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
        eyebrow={user ? 'Menu' : undefined}
        title={user?.displayName || 'UAE Trail'}
        showBrandMark={!user}
        ariaLabel="Landing navigation"
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
  const { canAccessPublishingWorkspace } = useMemberStatus({ enabled: Boolean(user) });
  const unreadNotifications = useNotificationUnreadCount();
  const { href: signInHref } = buildSignInRedirect({ pathname, search });

  const isAdminRole = user?.role === 'platform_admin';
  const isPrivilegedRole = canAccessPublishingWorkspace || isAdminRole;
  const onAdminConsole = pathname.startsWith('/admin');
  const onPublishingConsole = isPublishingConsolePath(pathname);
  const canSwitchBack = user?.role === 'participant' && Boolean(user?.switchedFromRole);

  // Console shells use dashboard drawers; consumer map/browse always use CONSUMER_HAMBURGER_MENU.
  if (isConsumerChromeHidden(pathname) && !isPrivilegedRole) return null;

  const profileDestination = user ? accountRouteByRole(user.role) : signInHref;

  const openPwaInstall = (action: 'pwa-android' | 'pwa-ios') => {
    closeMenu();
    const hash = action === 'pwa-ios' ? IOS_INSTALL_SETTINGS_HASH : ANDROID_INSTALL_SETTINGS_HASH;
    const from = search ? `${pathname}${search}` : pathname;
    const label = resolveMobileTabHeaderTitle(pathname, search) ?? 'Back';
    navigate(`${PROFILE_SETTINGS_PATH}${hash}`, {
      state: mobileBackNavState(from, label),
    });
  };

  const switchRole = async (target: 'participant' | 'original') => {
    closeMenu();
    try {
      const res = await switchMeRoleSession(target);
      persistAuthSessionTokens(res.tokens);
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

  if (canAccessPublishingWorkspace && onPublishingConsole) {
    return (
      <MobileDrawer
        open={open}
        closeMenu={closeMenu}
        eyebrow="Organise"
        title={user?.displayName || 'Account'}
        ariaLabel="Workspace navigation"
      >
        <DashboardDrawerLinks links={PUBLISHING_CONSOLE_LINKS} pathname={pathname} closeMenu={closeMenu} />
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
    <MobileDrawer
      open={open}
      closeMenu={closeMenu}
      eyebrow="Menu"
      showBrandMark
      title="UAE Trail"
      ariaLabel="Main menu"
    >
      <div className={MOBILE_DRAWER.stack}>
        <div className={MOBILE_DRAWER.group}>
          {CONSUMER_HAMBURGER_MENU.filter((item) => item.kind === 'link').map((item) => {
            const linkItem = item as ConsumerHamburgerLinkItem;
            const active = isConsumerHamburgerLinkActive(linkItem, pathname, search);
            const label = user || !linkItem.labelGuest ? linkItem.label : linkItem.labelGuest;
            const iconKey = linkItem.profileLink && !user ? 'Log in' : linkItem.label;
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

        {CONSUMER_HAMBURGER_MENU.filter((item) => item.kind === 'download').map((item) => (
          <div key={item.title} role="group" aria-label={item.title}>
            <p className={MOBILE_DRAWER.sectionLabel}>{item.title}</p>
            <div className={MOBILE_DRAWER.group}>
              {item.items.map((sub) => {
                const PlatformIcon = sub.action === 'pwa-android' ? Smartphone : Tablet;
                return (
                  <button
                    key={sub.label}
                    type="button"
                    onClick={() => openPwaInstall(sub.action)}
                    className={mobileDrawerRowClass(false)}
                  >
                    <DrawerNavIcon active={false} icon={PlatformIcon} />
                    <span className={`min-w-0 flex-1 ${drawerNavLabelClass(false)}`}>{sub.label}</span>
                    <Download className="h-4 w-4 shrink-0 text-emerald-700/70" strokeWidth={2.25} aria-hidden />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {(canSwitchBack || user) && (
          <div className={MOBILE_DRAWER.group}>
            {canSwitchBack ? (
              <button
                type="button"
                onClick={() => void switchRole('original')}
                className={mobileDrawerRowClass(false)}
              >
                <DrawerNavIcon active={false} icon={RefreshCw} />
                <span className={`${drawerNavLabelClass(false)} text-emerald-800`}>
                  Restore {user?.switchedFromRole?.replace(/_/g, ' ')}
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
                <span className={drawerNavLabelClass(false)}>Sign Out</span>
              </button>
            ) : null}
          </div>
        )}
      </div>
    </MobileDrawer>
  );
};
