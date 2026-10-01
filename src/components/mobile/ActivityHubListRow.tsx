import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface ActivityHubListRowProps {
  title: string;
  meta?: string | null;
  leading?: ReactNode;
  badge?: ReactNode;
  onClick: () => void;
  menu?: ReactNode;
}

/** Compact tappable row for Joined / Hosted activity lists. */
export const ActivityHubListRow = ({
  title,
  meta,
  leading,
  badge,
  onClick,
  menu,
}: ActivityHubListRowProps) => {
  const shellClass = menu
    ? 'glass-card-interactive flex w-full items-center gap-1 p-1 pl-3.5'
    : 'glass-card-interactive flex w-full items-center gap-3 p-3.5 text-left';

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
