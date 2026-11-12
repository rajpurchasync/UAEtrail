import type { ReactNode } from 'react';

/** Hide when value is empty — matches plan §8 empty-section rule. */
export const StatTile = ({
  label,
  value,
  icon,
  showWhenEmpty = false,
}: {
  label: string;
  value?: ReactNode;
  icon?: ReactNode;
  /** Keep the chip visible for intentional empty states (e.g. “No ratings yet”). */
  showWhenEmpty?: boolean;
}) => {
  const empty = value == null || value === '' || value === 0;
  if (empty && !showWhenEmpty) return null;
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-xl border border-neutral-200/90 bg-white p-2.5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-3 lg:flex-row lg:items-center lg:gap-2 lg:rounded-2xl">
      {icon ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-emerald-800 dark:bg-neutral-800 dark:text-emerald-300 lg:h-8 lg:w-8 lg:rounded-xl">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 lg:flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {label}
        </p>
        <p className="text-base font-semibold tabular-nums leading-snug text-neutral-900 break-words dark:text-neutral-50 lg:text-sm">
          {value}
        </p>
      </div>
    </div>
  );
};
