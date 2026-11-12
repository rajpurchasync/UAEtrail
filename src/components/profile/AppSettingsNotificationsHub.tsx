import type { ReactNode } from 'react';
import { Bell, MapPin, Settings2, type LucideIcon } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { PageMeta } from '../seo/PageMeta';
import {
  NOTIFICATION_HUB_PANELS,
  notificationHubPanelFromPath,
} from '../../config/notificationHub';
import { NotificationHistoryPanel } from '../notifications/NotificationHistoryPanel';
import { NotificationPreferencesSection } from '../notifications/NotificationPreferencesSection';
import { NotificationSavedMapPanel } from '../notifications/NotificationSavedMapPanel';
import { useProfileSettingsBackChrome } from '../../hooks/useProfileHubBackChrome';
import { useMinWidthLg } from '../../hooks/useMinWidthLg';
import { DesktopSettingsShell } from './DesktopSettingsShell';
import type { NotificationHubPanel } from '../../config/notificationHub';

const NOTIFICATION_HUB_PANEL_ICONS: Record<NotificationHubPanel, LucideIcon> = {
  history: Bell,
  settings: Settings2,
  saved: MapPin,
};

const panelTitle = (panel: ReturnType<typeof notificationHubPanelFromPath>): string => {
  if (panel === 'settings') return 'Notification settings';
  if (panel === 'saved') return 'Saved map & alerts';
  return 'Notification history';
};

const NotificationPanelsBody = ({ mobileSurface = false }: { mobileSurface?: boolean }) => {
  const { pathname } = useLocation();
  const panel = notificationHubPanelFromPath(pathname);

  const renderPanel = () => {
    if (panel === 'settings') {
      return <NotificationPreferencesSection mobileSurface={mobileSurface} />;
    }
    if (panel === 'saved') {
      return <NotificationSavedMapPanel mobileSurface={mobileSurface} />;
    }
    return <NotificationHistoryPanel />;
  };

  return (
    <div className="pb-nav-safe">
      <nav
        aria-label="Notification sections"
        className="mb-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scroll-touch md:mx-0 md:gap-3 md:px-0 md:pb-0 lg:grid lg:grid-cols-3 lg:gap-3 lg:overflow-visible"
      >
        {NOTIFICATION_HUB_PANELS.map((item) => {
          const active = item.id === panel;
          const Icon = NOTIFICATION_HUB_PANEL_ICONS[item.id];
          return (
            <Link
              key={item.id}
              to={item.path}
              replace
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              className={`shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 lg:w-full lg:min-w-0 ${
                active
                  ? 'rounded-full bg-emerald-600 text-white shadow-sm md:rounded-xl md:border md:border-emerald-300 md:bg-emerald-50 md:text-emerald-900 md:shadow-sm'
                  : 'rounded-full bg-white text-neutral-700 ring-1 ring-inset ring-neutral-200 md:rounded-xl md:border md:border-neutral-200 md:bg-white md:text-neutral-600 md:ring-0 md:hover:border-neutral-300 md:hover:bg-neutral-50 md:hover:text-neutral-900'
              } inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold md:gap-2.5 md:px-4 md:py-3 md:text-left lg:items-start`}
            >
              <Icon
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 md:h-4 md:w-4 lg:mt-0.5 ${
                  active ? 'text-white md:text-emerald-700' : 'text-neutral-500 md:text-neutral-500'
                }`}
                aria-hidden
              />
              <span className="min-w-0 lg:flex-1">
                <span
                  className={`block whitespace-nowrap md:whitespace-normal md:text-sm md:font-semibold md:leading-snug lg:text-[0.9375rem] lg:leading-6 ${
                    active ? 'md:text-emerald-900' : 'md:text-neutral-800 lg:text-neutral-900'
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`mt-0.5 hidden text-xs font-normal leading-snug lg:block lg:text-sm lg:leading-5 ${
                    active ? 'text-emerald-800/90' : 'text-neutral-600'
                  }`}
                >
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="min-w-0">{renderPanel()}</div>
    </div>
  );
};

/** Notifications under Settings — history, preferences, saved map alerts. */
export const AppSettingsNotificationsHub = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const panel = notificationHubPanelFromPath(pathname);
  const settingsBackChrome = useProfileSettingsBackChrome();
  const isDesktop = useMinWidthLg();

  if (user?.role === 'platform_admin') {
    return <Navigate to="/admin/notifications" replace />;
  }

  if (isDesktop) {
    return (
      <DesktopSettingsShell activeSection="notifications">
        <NotificationPanelsBody />
      </DesktopSettingsShell>
    );
  }

  return (
    <ConsumerShell
      layout="stack"
      title={panel === 'history' ? 'Notifications' : panelTitle(panel)}
      maxWidth="7xl"
      showJourney={false}
      back={settingsBackChrome}
    >
      <PageMeta title="Notifications" noIndex />
      <MotionWrap>
        <NotificationPanelsBody mobileSurface />
      </MotionWrap>
    </ConsumerShell>
  );
};

const MotionWrap = ({ children }: { children: ReactNode }) => (
  <div className="animate-fade-up">{children}</div>
);
