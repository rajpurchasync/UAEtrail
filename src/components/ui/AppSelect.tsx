import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface AppSelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface AppSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly AppSelectOption<T>[];
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'compact';
  placeholder?: string;
  inputClassName?: string;
  menuClassName?: string;
  'aria-label'?: string;
}

/** Desktop admin / dashboard filter fields. */
export const ADMIN_SELECT_CLASS = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm';

/** Compact toolbar filter (admin tables). */
export const ADMIN_FILTER_SELECT_CLASS = 'rounded border border-gray-200 bg-white px-3 py-1.5 text-sm';

/** Styled dropdown — avoids native `<select>` popover glitches on mobile and desktop. */
export function AppSelect<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
  className = '',
  size = 'default',
  placeholder,
  inputClassName,
  menuClassName = '',
  'aria-label': ariaLabel,
}: AppSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const showPlaceholder = !selected && Boolean(placeholder);
  const displayLabel = selected?.label ?? placeholder ?? 'Select';

  useEffect(() => {
    if (!open) return;

    const onDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDocumentClick);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const triggerClass =
    inputClassName ??
    (size === 'compact'
      ? 'min-h-0 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700'
      : 'ios-input min-h-[48px] text-[14px]');

  const menuAlignClass = size === 'compact' ? 'right-0 left-auto min-w-[8.5rem]' : 'left-0 right-0';

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel ?? (showPlaceholder ? placeholder : selected?.label)}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-2 text-left transition ${triggerClass} ${
          disabled ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <span className={`truncate ${showPlaceholder ? 'text-neutral-400' : ''}`}>{displayLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute top-[calc(100%+4px)] z-[100] max-h-60 overflow-y-auto scroll-touch rounded-2xl border border-neutral-200/90 bg-white py-1 shadow-lg shadow-neutral-900/10 ${menuAlignClass} ${menuClassName}`}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-neutral-50 ${
                    active ? 'bg-emerald-50 font-medium text-emerald-800' : 'text-neutral-700'
                  }`}
                >
                  <span>{option.label}</span>
                  {active && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
