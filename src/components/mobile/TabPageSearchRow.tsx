import { Plus, Search } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

const actionButtonClass =
  'touch-target-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm active:scale-[0.98]';

const searchToggleClass =
  'touch-target-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-600 shadow-sm active:scale-[0.98] md:hidden';

const searchInputClass =
  'w-full rounded-2xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

interface TabPageSearchRowProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Renders a green + button when set (ignored if `action` is provided). */
  onAction?: () => void;
  actionAriaLabel?: string;
  action?: ReactNode;
  /** On small screens, show a search icon until expanded (full field always on md+). */
  mobileSearch?: 'field' | 'icon';
}

/** Search field with optional trailing action — sits below the unified tab header, not inside it. */
export const TabPageSearchRow = ({
  value,
  onChange,
  placeholder = 'Search',
  onAction,
  actionAriaLabel,
  action,
  mobileSearch = 'field',
}: TabPageSearchRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isIconMode = mobileSearch === 'icon';
  const showSearchField = !isIconMode || mobileSearchOpen || value.trim().length > 0;

  useEffect(() => {
    if (!mobileSearchOpen) return;
    inputRef.current?.focus();
  }, [mobileSearchOpen]);

  const trailing =
    action ??
    (onAction ? (
      <button
        type="button"
        onClick={onAction}
        className={actionButtonClass}
        aria-label={actionAriaLabel ?? 'Create'}
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
      </button>
    ) : null);

  return (
    <div className="flex items-center gap-2 pt-2">
      <label
        className={[
          'relative min-w-0 flex-1',
          isIconMode && !showSearchField ? 'hidden md:block' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            if (isIconMode && !value.trim()) setMobileSearchOpen(false);
          }}
          placeholder={placeholder}
          className={searchInputClass}
        />
      </label>

      {isIconMode && !showSearchField ? (
        <>
          <div className="min-w-0 flex-1 md:hidden" aria-hidden />
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            className={searchToggleClass}
            aria-label={placeholder}
          >
            <Search className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </button>
        </>
      ) : null}

      {trailing}
    </div>
  );
};
