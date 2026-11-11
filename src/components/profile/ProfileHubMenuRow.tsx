import { Link } from 'react-router-dom';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { MobileBackNavState } from '../../utils/mobileBackNav';

type ProfileHubMenuRowProps = {
  label: string;
  to: string;
  icon: LucideIcon;
  linkState?: MobileBackNavState;
  badge?: number | string;
};

export const ProfileHubMenuRow = ({
  label,
  to,
  icon: Icon,
  linkState,
  badge,
}: ProfileHubMenuRowProps) => (
  <Link
    to={to}
    state={linkState}
    data-nav-focus={`profile-hub-${label.toLowerCase().replace(/\s+/g, '-')}`}
    className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-neutral-50"
  >
    <Icon className="h-[18px] w-[18px] shrink-0 text-emerald-700/80" strokeWidth={2} aria-hidden />
    <span className="min-w-0 flex-1 text-[15px] font-medium text-neutral-900">{label}</span>
    {badge != null && badge !== '' && Number(badge) !== 0 ? (
      <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
        {typeof badge === 'number' && badge > 99 ? '99+' : badge}
      </span>
    ) : null}
    <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
  </Link>
);

export const ProfileHubMenuSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-1.5">
    <h3 className="px-0.5 text-xs font-semibold text-neutral-500">{title}</h3>
    <div className="glass-card divide-y divide-neutral-100 overflow-hidden">{children}</div>
  </section>
);
