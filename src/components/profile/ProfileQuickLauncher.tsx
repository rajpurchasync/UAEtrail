import { Link } from 'react-router-dom';
import {
  BUDDIES_PATH,
  CONTRIBUTIONS_PATH,
  PROFILE_BADGES_PATH,
} from '../../config/routingCatalog';
import type { LucideIcon } from 'lucide-react';
import { Award, MapPin, Mountain, Settings, Users } from 'lucide-react';

export type ProfileQuickLauncherItem = {
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
  iconWrapClassName: string;
  badge?: number | string;
};

type ProfileQuickLauncherProps = {
  items: ProfileQuickLauncherItem[];
};

const LauncherTile = ({ item }: { item: ProfileQuickLauncherItem }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className="glass-card-interactive flex min-h-[76px] flex-col items-center justify-center gap-2 p-3 text-center"
    >
      <span className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${item.iconWrapClassName}`}>
        <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        {item.badge != null && item.badge !== '' && Number(item.badge) !== 0 ? (
          <span className="absolute -right-1.5 -top-1 min-w-[18px] rounded-full bg-emerald-600 px-1 text-[10px] font-bold leading-[18px] text-white">
            {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
          </span>
        ) : null}
      </span>
      <span className="text-[11px] font-semibold leading-tight text-neutral-800">{item.label}</span>
    </Link>
  );
};

/** Above-fold shortcuts — non-tab destinations only (no Trips / Messages). */
export const ProfileQuickLauncher = ({ items }: ProfileQuickLauncherProps) => {
  if (items.length === 0) return null;

  return (
    <section aria-label="Quick links">
      <div className={`grid gap-2 ${items.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
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
    {
      key: 'friends',
      label: 'Friends',
      to: BUDDIES_PATH,
      icon: Users,
      iconWrapClassName: 'bg-blue-50 text-blue-700',
      badge: input.buddyBadge,
    },
    {
      key: 'badges',
      label: 'Badges',
      to: PROFILE_BADGES_PATH,
      icon: Award,
      iconWrapClassName: 'bg-amber-50 text-amber-800',
      badge: input.badgesEarnedCount > 0 ? input.badgesEarnedCount : undefined,
    },
    {
      key: 'contributions',
      label: 'Contributions',
      to: CONTRIBUTIONS_PATH,
      icon: MapPin,
      iconWrapClassName: 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'settings',
      label: 'Settings',
      to: '/profile/settings',
      icon: Settings,
      iconWrapClassName: 'bg-neutral-100 text-neutral-700',
    },
  ];

  if (input.showHosting) {
    items.push({
      key: 'hosting',
      label: 'Hosting',
      to: '/host/overview',
      icon: Mountain,
      iconWrapClassName: 'bg-violet-50 text-violet-700',
    });
  }

  return items;
};
