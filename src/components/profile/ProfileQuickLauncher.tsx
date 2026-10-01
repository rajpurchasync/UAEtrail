import { Link } from 'react-router-dom';

export type ProfileQuickLauncherItem = {
  key: string;
  emoji: string;
  label: string;
  to: string;
  badge?: number | string;
};

type ProfileQuickLauncherProps = {
  items: ProfileQuickLauncherItem[];
};

const LauncherTile = ({ item }: { item: ProfileQuickLauncherItem }) => (
  <Link
    to={item.to}
    className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-neutral-50 px-2 py-3 text-center ring-1 ring-neutral-200/80 active:bg-neutral-100"
  >
    <span className="relative text-2xl leading-none" aria-hidden>
      {item.emoji}
      {item.badge != null && item.badge !== '' && Number(item.badge) !== 0 ? (
        <span className="absolute -right-2 -top-1 min-w-[18px] rounded-full bg-emerald-600 px-1 text-[10px] font-bold leading-[18px] text-white">
          {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
        </span>
      ) : null}
    </span>
    <span className="text-[11px] font-semibold leading-tight text-neutral-800">{item.label}</span>
  </Link>
);

/** Above-fold shortcuts — non-tab destinations only (no Trips / Messages). */
export const ProfileQuickLauncher = ({ items }: ProfileQuickLauncherProps) => {
  if (items.length === 0) return null;

  return (
    <section aria-label="Quick links" className="rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm">
      <div
        className={`grid gap-2 ${
          items.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
        }`}
      >
        {items.map((item) => (
          <LauncherTile key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
};

export const buildProfileQuickLauncherItems = (input: {
  buddyBadge?: number;
  badgesEarnedCount: number;
  showHosting?: boolean;
}): ProfileQuickLauncherItem[] => {
  const items: ProfileQuickLauncherItem[] = [
    { key: 'friends', emoji: '👋', label: 'Friends', to: '/buddies', badge: input.buddyBadge },
    {
      key: 'badges',
      emoji: '🏅',
      label: 'Badges',
      to: '/profile/badges',
      badge: input.badgesEarnedCount > 0 ? input.badgesEarnedCount : undefined,
    },
    { key: 'contributions', emoji: '📍', label: 'Contributions', to: '/contributions' },
    { key: 'settings', emoji: '⚙️', label: 'Settings', to: '/profile/settings' },
  ];

  if (input.showHosting) {
    items.push({ key: 'hosting', emoji: '🏔️', label: 'Hosting', to: '/host/overview' });
  }

  return items;
};
