import { Link } from 'react-router-dom';
import { LogOut, UserRound } from 'lucide-react';
import { ADMIN_NAV_GROUPS } from '../../admin/adminNav';
import { isAdminConsoleNavActive } from '../../admin/adminNavActive';
import { useAdminInboxBadges } from '../../hooks/useAdminInboxBadges';

type AdminConsoleSidebarProps = {
  pathname: string;
  unreadNotifications: number;
  onSignOut: () => void | Promise<void>;
  onSwitchToVisitor: () => void | Promise<void>;
  switchingRole?: boolean;
  compact?: boolean;
};

const navLinkClass = (active: boolean) =>
  `group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
    active
      ? 'bg-emerald-50 font-semibold text-emerald-800'
      : 'font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
  }`;

const badgeFor = (
  key: 'submissions' | 'applications' | 'reports' | 'safety' | 'notifications' | undefined,
  badges: ReturnType<typeof useAdminInboxBadges>,
  unreadNotifications: number
): number => {
  if (!key) return 0;
  if (key === 'notifications') return unreadNotifications;
  return badges[key] ?? 0;
};

export const AdminConsoleSidebar = ({
  pathname,
  unreadNotifications,
  onSignOut,
  onSwitchToVisitor,
  switchingRole = false,
  compact = false,
}: AdminConsoleSidebarProps) => {
  const badges = useAdminInboxBadges();

  return (
    <nav className="space-y-4" aria-label="Admin console">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.id}>
          {!compact ? (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              {group.label}
            </p>
          ) : null}
          <ul className="space-y-0.5">
            {group.links.map((link) => {
              const active = isAdminConsoleNavActive(pathname, link.to, { exact: link.exact });
              const Icon = link.icon;
              const count = badgeFor(link.badgeKey, badges, unreadNotifications);
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`${navLinkClass(active)} justify-between`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      <span className="truncate">{link.label}</span>
                    </span>
                    {count > 0 ? (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-bold text-white">
                        {count > 99 ? '99+' : count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="border-t border-neutral-100 pt-2">
        <button
          type="button"
          disabled={switchingRole}
          onClick={() => void onSwitchToVisitor()}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-60"
        >
          <UserRound className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          {switchingRole ? 'Switching…' : 'Switch to visitor'}
        </button>
        <button
          type="button"
          onClick={() => void onSignOut()}
          className="mt-0.5 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </nav>
  );
};
