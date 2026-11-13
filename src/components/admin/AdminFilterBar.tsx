import type { FormEvent, ReactNode } from 'react';

type AdminFilterBarProps = {
  children: ReactNode;
  onSubmit?: (event: FormEvent) => void;
  onClear?: () => void;
  actions?: ReactNode;
  clearLabel?: string;
};

/** Compact wrap row for admin list filters (settings-like density). */
export const AdminFilterBar = ({
  children,
  onSubmit,
  onClear,
  actions,
  clearLabel = 'Clear',
}: AdminFilterBarProps) => {
  const body = (
    <div className="flex flex-wrap items-end gap-2">
      {children}
      {actions}
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
  if (!onSubmit) return <div className="mb-4">{body}</div>;
  return (
    <form className="mb-4" onSubmit={onSubmit}>
      {body}
    </form>
  );
};
