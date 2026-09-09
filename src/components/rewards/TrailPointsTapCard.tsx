import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface TrailPointsTapCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  onClick: () => void;
}

/** Summary row that opens a Trail Points detail sheet. */
export const TrailPointsTapCard = ({
  icon: Icon,
  title,
  subtitle,
  badge,
  onClick,
}: TrailPointsTapCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-2xl border border-neutral-100 bg-white px-4 py-3.5 text-left shadow-sm transition-colors active:bg-emerald-50/60"
  >
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
      <Icon className="h-5 w-5" strokeWidth={2.1} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-bold text-neutral-900">{title}</span>
      {subtitle && <span className="mt-0.5 block text-xs leading-snug text-neutral-500">{subtitle}</span>}
    </span>
    {badge && <span className="shrink-0">{badge}</span>}
    <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
  </button>
);
