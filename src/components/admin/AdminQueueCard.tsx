import { Children, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type AdminQueueCardProps = {
  title: string;
  viewAllTo?: string;
  viewAllLabel?: string;
  icon?: ReactNode;
  iconClassName?: string;
  empty: string;
  children: ReactNode;
  count?: number;
};

/** Interactive queue container — list of items needing admin action. */
export const AdminQueueCard = ({
  title,
  viewAllTo,
  viewAllLabel = 'View all',
  icon,
  iconClassName = 'bg-emerald-50 text-emerald-800',
  empty,
  children,
  count,
}: AdminQueueCardProps) => {
  const hasItems = Children.count(children) > 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,.04)]">
      <header className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
        <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-neutral-900">
          {icon ? (
            <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
              {icon}
            </span>
          ) : null}
          <span className="truncate">{title}</span>
          {typeof count === 'number' ? (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
              {count}
            </span>
          ) : null}
        </h3>
        {viewAllTo ? (
          <Link to={viewAllTo} className="shrink-0 text-xs font-medium text-emerald-700 hover:text-emerald-800">
            {viewAllLabel}
          </Link>
        ) : null}
      </header>
      <div className="divide-y divide-neutral-100">
        {hasItems ? children : <p className="px-4 py-8 text-center text-sm text-neutral-500">{empty}</p>}
      </div>
    </section>
  );
};
