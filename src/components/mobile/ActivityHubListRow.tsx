import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface ActivityHubListRowProps {
  title: string;
  meta?: string | null;
  leading?: ReactNode;
  badge?: ReactNode;
  onClick: () => void;
  menu?: ReactNode;
  /** Plain rows for lists already inside a bordered section (no nested glass card). */
  variant?: 'card' | 'plain';
}

/** Compact tappable row for Joined / Hosted activity lists. */
export const ActivityHubListRow = ({
  title,
  meta,
  leading,
  badge,
  onClick,
  menu,
  variant = 'card',
}: ActivityHubListRowProps) => {
  const plainShell = menu
    ? 'flex w-full items-center gap-1 py-1 pl-0.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
    : 'flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40';
  const cardShell = menu
    ? 'glass-card-interactive flex w-full items-center gap-1 p-1 pl-3.5'
    : 'glass-card-interactive flex w-full items-center gap-3 p-3.5 text-left';
  const shellClass = variant === 'plain' ? plainShell : cardShell;

  const main = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900 truncate">{title}</p>
        {meta && <p className="text-xs text-neutral-500 mt-0.5 truncate">{meta}</p>}
      </div>
      {badge}
      {!menu ? <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" /> : null}
    </>
  );

  if (menu) {
    return (
      <div className={shellClass}>
        <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left">
          {main}
        </button>
        <div className="flex shrink-0 items-center self-stretch pr-1">{menu}</div>
      </div>
    );
  }

  return (
    <button type="button" onClick={onClick} className={shellClass}>
      {main}
    </button>
  );
};
