import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface ActivityHubListRowProps {
  title: string;
  meta?: string | null;
  badge?: ReactNode;
  onClick: () => void;
  menu?: ReactNode;
}

/** Compact tappable row for Joined / Hosted activity lists. */
export const ActivityHubListRow = ({
  title,
  meta,
  badge,
  onClick,
  menu,
}: ActivityHubListRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className="glass-card-interactive flex w-full items-center gap-3 p-3.5 text-left"
  >
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-neutral-900 truncate">{title}</p>
      {meta && <p className="text-xs text-neutral-500 mt-0.5 truncate">{meta}</p>}
    </div>
    {badge}
    {menu}
    <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
  </button>
);
