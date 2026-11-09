import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Briefcase, PanelLeft, PanelLeftClose, Shield } from 'lucide-react';
import { UiTooltip } from '../../ui/UiTooltip';
import {
  DESKTOP_MAP_NAV,
  DESKTOP_MAP_SECTION_TITLE,
  DESKTOP_PEOPLE_NAV,
  DESKTOP_PEOPLE_SECTION_TITLE,
  DESKTOP_SIDE_NAV_SECTIONS,
  desktopPrimaryNavForSession,
  isDesktopNavItemActive,
  type DesktopNavBadge,
  type DesktopNavItem,
} from '../../../config/desktopNav';
import {
  DESKTOP_SIDE_NAV_MAX_WIDTH,
  DESKTOP_SIDE_NAV_MIN_WIDTH,
  useDesktopSideNavExpanded,
} from '../../../hooks/useDesktopSideNavExpanded';
import { ADMIN_OVERVIEW_PATH, EXPLORE_MAP_PATH, joinAuthPath, PLAN_PATH, PROFILE_PATH } from '../../../config/routingCatalog';
import {
  PRODUCT_HOSTING_SCHEDULE_NAV_HINT,
  PRODUCT_HOSTING_SCHEDULE_NAV_LABEL,
} from '../../../content/productNorthStar';
import { planHostedSchedulePath, isPlanHostingFilterRoute, isPlanMemberNavActive, planMemberNavPath } from '../../../plan/planRouting';
import { useAuth } from '../../../context/AuthContext';
import { useInboxUnreadCount } from '../../../hooks/useInboxUnreadCount';
import { useMemberStatus } from '../../../hooks/useMemberStatus';
import { useNotificationUnreadCount } from '../../../hooks/useNotificationUnreadCount';
import { SecureAvatar } from '../../ui/SecureAvatar';
import { buildSignInRedirect } from '../../../utils/authReturnContext';

const FOOTER_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'Help' },
  { to: '/contact', label: 'Contact' },
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/sitemap', label: 'Sitemap' },
] as const;

const formatBadge = (count: number) => (count > 99 ? '99+' : String(count));

type SideNavLinkProps = {
  to: string;
  label: string;
  icon: DesktopNavItem['icon'];
  active: boolean;
  compact: boolean;
  badge?: number;
  navHint?: string;
};

const SideNavLink = ({ to, label, icon: Icon, active, compact, badge = 0, navHint }: SideNavLinkProps) => {
  const link = (
  <Link
    to={to}
    aria-label={compact ? label : undefined}
    aria-current={active ? 'page' : undefined}
    className={`group relative flex min-h-8 items-center gap-2 rounded-lg py-1 text-sm leading-snug transition-colors ${
      compact ? 'justify-center px-0' : 'justify-start px-2.5'
    } ${
      active
        ? 'bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
        : 'font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50'
    }`}
  >
    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
      <Icon
        className={`h-4 w-4 ${active ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-500 group-hover:text-neutral-700 dark:text-neutral-400'}`}
        strokeWidth={active ? 2.25 : 2}
        aria-hidden
      />
      {badge > 0 && compact ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
          {formatBadge(badge)}
        </span>
      ) : null}
    </span>
    <span className={compact ? 'sr-only' : 'min-w-0 flex-1 truncate'}>{label}</span>
    {badge > 0 && !compact ? (
      <span className="min-w-[22px] rounded-full bg-emerald-600 px-1.5 text-center text-[11px] font-bold leading-5 text-white">
        {formatBadge(badge)}
      </span>
    ) : null}
  </Link>
  );
  const tooltip = navHint
    ? compact
      ? `${label} — ${navHint}`
      : navHint
    : compact
      ? label
      : undefined;
  return tooltip ? <UiTooltip label={tooltip}>{link}</UiTooltip> : link;
};

const resolveDesktopNavHref = (
  item: DesktopNavItem,
  user: { id: string } | null,
  showOrganiserPlanShortcut: boolean
): string => {
  if (item.key === 'plan') {
    return user ? planMemberNavPath(showOrganiserPlanShortcut) : PLAN_PATH;
  }
  return item.to;
};

/** Persistent left navigation for tablet and desktop (guests and signed-in members). */
export const DesktopSideNav = () => {
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const { href: signInHref } = buildSignInRedirect({ pathname, search });
  const {
    width,
    expanded,
    compact,
    toggleExpanded,
    onResizePointerDown,
    onResizePointerMove,
    onResizePointerUp,
    onResizeKeyDown,
  } = useDesktopSideNavExpanded();
  const { canAccessPublishingWorkspace } = useMemberStatus({ enabled: Boolean(user) });
  const unreadChat = useInboxUnreadCount();
  const unreadNotifications = useNotificationUnreadCount();

  useEffect(() => {
    document.documentElement.style.setProperty('--desktop-side-nav-width', `${width}px`);
    return () => {
      document.documentElement.style.removeProperty('--desktop-side-nav-width');
    };
  }, [width]);

  const badgeCount = (badge?: DesktopNavBadge) =>
    badge === 'chat' ? unreadChat : badge === 'notifications' ? unreadNotifications : 0;
  const displayName = user?.displayName || user?.email || 'Your profile';
  const profileActive = pathname === PROFILE_PATH;
  const sectionTitleClass = compact
    ? 'sr-only'
    : 'block px-2.5 pb-0.5 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500';

  const showOrganiserPlanShortcut = Boolean(user && canAccessPublishingWorkspace);
  const primaryNav = desktopPrimaryNavForSession(Boolean(user));

  const renderItems = (items: readonly DesktopNavItem[]) =>
    items.map((item) => {
      const isPlan = item.key === 'plan';
      return (
        <SideNavLink
          key={item.key}
          to={resolveDesktopNavHref(item, user, showOrganiserPlanShortcut)}
          label={item.label}
          icon={item.icon}
          active={
            isPlan
              ? user
                ? isPlanMemberNavActive(pathname, search, showOrganiserPlanShortcut)
                : false
              : isDesktopNavItemActive(item, pathname, search)
          }
          compact={compact}
          badge={user ? badgeCount(item.badge) : 0}
          navHint={item.navHint}
        />
      );
    });

  return (
    <aside
      aria-label="App navigation"
      data-desktop-side-nav
      style={{ width }}
      className="relative z-[6800] hidden min-h-0 shrink-0 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 md:flex md:overflow-visible"
    >
      <div className="shrink-0 px-2 pt-3 pb-1">
        {user ? (
          <Link
            to={PROFILE_PATH}
            title={displayName}
            aria-current={profileActive ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl py-2 transition-colors ${
              compact ? 'justify-center px-0' : 'justify-start px-3'
            } ${profileActive ? 'bg-emerald-50' : 'hover:bg-neutral-100'}`}
          >
            <SecureAvatar src={user.avatarUrl} name={displayName} className="h-9 w-9 shrink-0 text-sm" />
            <span className={compact ? 'sr-only' : 'min-w-0 flex-1'}>
              <span className="block truncate text-sm font-semibold text-neutral-900">{displayName}</span>
              <span className="block truncate text-xs text-neutral-500">View your profile</span>
            </span>
          </Link>
        ) : (
          <div
            className={`flex flex-col gap-2 rounded-xl py-2 ${
              compact ? 'items-center px-0' : 'px-3'
            }`}
          >
            {!compact ? (
              <p className="text-sm font-semibold text-neutral-900">Find your people outdoors</p>
            ) : null}
            <Link
              to={joinAuthPath(EXPLORE_MAP_PATH)}
              className={`w-fit rounded-full bg-emerald-600 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 ${
                compact ? 'px-3 py-1.5' : 'px-3.5 py-1.5'
              }`}
            >
              Join free
            </Link>
            <Link
              to={signInHref}
              className={`text-center text-sm font-medium text-neutral-600 hover:text-neutral-900 ${
                compact ? 'py-1' : 'py-0.5'
              }`}
            >
              Sign in
            </Link>
          </div>
        )}
      </div>

      <nav
        aria-label="Primary"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-2 scroll-touch product-sidebar-scroll"
      >
        <div role="group" aria-label="Go">
          <p className={compact ? sectionTitleClass : `${sectionTitleClass} pt-1`}>Go</p>
          <div className={compact ? 'mt-1.5 border-t border-neutral-100 pt-1.5' : undefined}>
            {renderItems(primaryNav)}
          </div>
        </div>

        {user ? (
          <div role="group" aria-label={DESKTOP_PEOPLE_SECTION_TITLE}>
            <p className={sectionTitleClass}>{DESKTOP_PEOPLE_SECTION_TITLE}</p>
            <div className={compact ? 'mt-1.5 border-t border-neutral-100 pt-1.5' : undefined}>
              {renderItems(DESKTOP_PEOPLE_NAV)}
            </div>
          </div>
        ) : null}

        <div role="group" aria-label={DESKTOP_MAP_SECTION_TITLE}>
          <p className={sectionTitleClass}>{DESKTOP_MAP_SECTION_TITLE}</p>
          <div className={compact ? 'mt-1.5 border-t border-neutral-100 pt-1.5' : undefined}>
            {renderItems(DESKTOP_MAP_NAV)}
          </div>
        </div>

        {(user
          ? DESKTOP_SIDE_NAV_SECTIONS
          : DESKTOP_SIDE_NAV_SECTIONS.map((section) => ({
              ...section,
              items: section.items.filter((item) => item.key === 'settings'),
            })).filter((section) => section.items.length > 0)
        ).map((section) => (
          <div key={section.key} role="group" aria-label={section.title}>
            <p className={sectionTitleClass}>{section.title}</p>
            <div className={compact ? 'mt-1.5 border-t border-neutral-100 pt-1.5' : undefined}>
              {renderItems(section.items)}
            </div>
          </div>
        ))}

        {user && (canAccessPublishingWorkspace || user.role === 'platform_admin') ? (
          <div role="group" aria-label="Hosting">
            <p className={sectionTitleClass}>Hosting</p>
            <div className={compact ? 'mt-1.5 border-t border-neutral-100 pt-1.5' : undefined}>
              {canAccessPublishingWorkspace ? (
                <SideNavLink
                  to={planHostedSchedulePath()}
                  label={PRODUCT_HOSTING_SCHEDULE_NAV_LABEL}
                  icon={Briefcase}
                  active={isPlanHostingFilterRoute(pathname, search)}
                  compact={compact}
                  navHint={PRODUCT_HOSTING_SCHEDULE_NAV_HINT}
                />
              ) : null}
              {user.role === 'platform_admin' ? (
                <SideNavLink
                  to={ADMIN_OVERVIEW_PATH}
                  label="Admin console"
                  icon={Shield}
                  active={false}
                  compact={compact}
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </nav>
      {compact ? null : (
        <footer className="shrink-0 border-t border-neutral-100 px-2 py-2.5 text-center dark:border-neutral-800">
          <ul className="flex flex-col items-center gap-1 text-xs text-neutral-500">
            {[FOOTER_LINKS.slice(0, 3), FOOTER_LINKS.slice(3)].map((row) => (
              <li key={row[0].to}>
                <ul className="flex items-center justify-center">
                  {row.map((link, index) => (
                    <li key={link.to} className="flex items-center">
                      {index > 0 ? (
                        <span className="mx-1.5 text-neutral-300" aria-hidden>
                          ·
                        </span>
                      ) : null}
                      <Link to={link.to} className="hover:text-neutral-800 hover:underline">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </footer>
      )}
      <div className="shrink-0 border-t border-neutral-100 p-2 dark:border-neutral-800">
        <UiTooltip
          label={expanded ? 'Collapse navigation' : 'Expand navigation'}
          className="block"
        >
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
            className={`flex w-full items-center gap-3 rounded-xl py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${
              compact ? 'justify-center px-0' : 'justify-start px-3'
            }`}
          >
            {expanded ? (
              <PanelLeftClose className="h-5 w-5 shrink-0" aria-hidden />
            ) : (
              <PanelLeft className="h-5 w-5 shrink-0" aria-hidden />
            )}
            <span className={compact ? 'sr-only' : 'truncate'}>{expanded ? 'Collapse' : 'Expand'}</span>
          </button>
        </UiTooltip>
      </div>
      <UiTooltip label="Drag to resize" side="right" className="contents">
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Drag to resize navigation"
          aria-valuemin={DESKTOP_SIDE_NAV_MIN_WIDTH}
          aria-valuemax={DESKTOP_SIDE_NAV_MAX_WIDTH}
          aria-valuenow={width}
          tabIndex={0}
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
          onKeyDown={onResizeKeyDown}
          className="group/resize absolute inset-y-0 -right-px z-[7000] flex w-3 cursor-ew-resize touch-none items-center justify-center max-md:hidden"
        >
          <span className="pointer-events-none relative flex flex-col gap-[3px]" aria-hidden>
            {Array.from({ length: 6 }, (_, index) => (
              <span
                key={index}
                className="h-[3px] w-[3px] rounded-full bg-neutral-400 shadow-[0_0_0_1px_rgba(255,255,255,.85)] transition-colors group-hover/resize:bg-neutral-600 group-focus-visible/resize:bg-neutral-600"
              />
            ))}
          </span>
        </div>
      </UiTooltip>
    </aside>
  );
};
