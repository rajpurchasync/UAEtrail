import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  FileClock,
  Flag,
  Inbox,
  LayoutDashboard,
  MapPin,
  MapPinned,
  Megaphone,
  ShieldAlert,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react';
import {
  ADMIN_ACCOUNT_PATH,
  ADMIN_ACTIVITIES_PATH,
  ADMIN_ALERTS_PATH,
  ADMIN_AREAS_PATH,
  ADMIN_AUDIT_LOG_PATH,
  ADMIN_FACILITIES_PATH,
  ADMIN_GROUPS_PATH,
  ADMIN_HOSTS_PATH,
  ADMIN_INBOX_PATH,
  ADMIN_INBOX_SUBMISSIONS_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_REPORTS_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_USERS_PATH,
} from '../config/adminSurfacePaths';
import { ADMIN_PLACES_PATH } from '../config/surfacePaths';

export type AdminNavLink = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Exact path match only (parent hubs with child routes). */
  exact?: boolean;
  badgeKey?: 'submissions' | 'applications' | 'reports' | 'safety' | 'notifications';
};

export type AdminNavGroup = {
  id: string;
  label: string;
  links: AdminNavLink[];
};

/** Grouped console IA — deep links preserved under Catalog / People / Ops. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'inbox',
    label: 'Inbox',
    links: [
      { to: ADMIN_INBOX_PATH, label: 'Inbox', icon: Inbox, exact: true },
      { to: ADMIN_INBOX_SUBMISSIONS_PATH, label: 'Submissions', icon: MapPin, badgeKey: 'submissions' },
      { to: ADMIN_HOSTS_PATH, label: 'Operators', icon: Briefcase, badgeKey: 'applications' },
      { to: ADMIN_REPORTS_PATH, label: 'Reports', icon: Flag, badgeKey: 'reports' },
      { to: ADMIN_ALERTS_PATH, label: 'Safety', icon: ShieldAlert, badgeKey: 'safety' },
    ],
  },
  {
    id: 'catalog',
    label: 'Catalog',
    links: [
      { to: ADMIN_PLACES_PATH, label: 'Places', icon: MapPin },
      { to: ADMIN_FACILITIES_PATH, label: 'Facilities', icon: Building2 },
      { to: ADMIN_AREAS_PATH, label: 'Areas', icon: MapPinned },
    ],
  },
  {
    id: 'people',
    label: 'People',
    links: [
      { to: ADMIN_USERS_PATH, label: 'Users & Members', icon: Users },
      { to: ADMIN_GROUPS_PATH, label: 'Groups', icon: UsersRound },
    ],
  },
  {
    id: 'outings',
    label: 'Outings',
    links: [{ to: ADMIN_ACTIVITIES_PATH, label: 'Activities', icon: CalendarDays }],
  },
  {
    id: 'ops',
    label: 'Ops',
    links: [
      { to: ADMIN_SETTINGS_PATH, label: 'Broadcast', icon: Megaphone },
      { to: ADMIN_AUDIT_LOG_PATH, label: 'Audit Log', icon: FileClock },
      {
        to: ADMIN_NOTIFICATIONS_PATH,
        label: 'Notifications',
        icon: Bell,
        badgeKey: 'notifications',
      },
      { to: ADMIN_ACCOUNT_PATH, label: 'Account', icon: UserRound },
    ],
  },
];

/** Flat sidebar order for acceptance + legacy consumers (DashboardLayout title lookup). */
export const ADMIN_SIDEBAR_LINKS: Array<{ to: string; label: string }> = ADMIN_NAV_GROUPS.flatMap((group) =>
  group.links
    .filter((link) => link.to !== ADMIN_NOTIFICATIONS_PATH)
    .map((link) => ({ to: link.to, label: link.label }))
);

export const adminPageTitleFromPath = (pathname: string, fallback: string): string => {
  const all = ADMIN_NAV_GROUPS.flatMap((g) => g.links);
  const exact = all.find((link) => pathname === link.to);
  if (exact) return exact.label;
  const nested = all.find((link) => !link.exact && pathname.startsWith(`${link.to}/`));
  if (nested) return nested.label;
  return fallback.replace(/^Admin( · | Dashboard)?/i, '').trim() || fallback;
};

export const ADMIN_FALLBACK_ICON = LayoutDashboard;
