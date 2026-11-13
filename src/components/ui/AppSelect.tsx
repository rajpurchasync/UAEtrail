import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

type AppSelectMenuLayout = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

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
export const ADMIN_FILTER_SELECT_CLASS =
  'rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900';

export const ADMIN_INPUT_CLASS =
  'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400';

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
  const [menuLayout, setMenuLayout] = useState<AppSelectMenuLayout | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const showPlaceholder = !selected && Boolean(placeholder);
  const displayLabel = selected?.label ?? placeholder ?? 'Select';

  const updateMenuLayout = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const viewportPad = 8;
    const minWidth = size === 'compact' ? 136 : rect.width;
    const width = size === 'compact' ? Math.max(rect.width, minWidth) : rect.width;
    const left =
      size === 'compact' ? Math.max(viewportPad, rect.right - width) : Math.max(viewportPad, rect.left);
    const spaceBelow = window.innerHeight - rect.bottom - viewportPad;
    const spaceAbove = rect.top - viewportPad;
    const preferBelow = spaceBelow >= 120 || spaceBelow >= spaceAbove;
    const maxHeight = Math.min(240, Math.max(96, preferBelow ? spaceBelow - gap : spaceAbove - gap));
    if (preferBelow) {
      setMenuLayout({ top: rect.bottom + gap, left, width, maxHeight });
    } else {
      setMenuLayout({
        bottom: window.innerHeight - rect.top + gap,
        left,
        width,
        maxHeight,
      });
    }
  }, [size]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuLayout(null);
      return;
    }
    updateMenuLayout();
    window.addEventListener('resize', updateMenuLayout);
    window.addEventListener('scroll', updateMenuLayout, true);
    return () => {
      window.removeEventListener('resize', updateMenuLayout);
      window.removeEventListener('scroll', updateMenuLayout, true);
    };
  }, [open, updateMenuLayout]);

  useEffect(() => {
    if (!open) return;

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const panel = document.getElementById(listId);
      if (panel?.contains(target)) return;
      setOpen(false);
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
  }, [open, listId]);

  const triggerClass =
    inputClassName ??
    (size === 'compact'
      ? 'min-h-0 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700'
      : 'ios-input min-h-[48px] text-[14px]');

  const menuPanel =
    open && menuLayout
      ? createPortal(
          <ul
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: 'fixed',
              top: menuLayout.top,
              bottom: menuLayout.bottom,
              left: menuLayout.left,
              width: menuLayout.width,
              maxHeight: menuLayout.maxHeight,
            }}
            className={`place-select-panel-fixed z-[7000] max-h-60 overflow-y-auto overscroll-contain py-1 ${menuClassName}`}
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
                    className={`place-select-option items-center justify-between ${
                      active ? 'place-select-option--selected' : ''
                    }`}
                  >
                    <span>{option.label}</span>
                    {active && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
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
        <span
          className={`truncate ${showPlaceholder ? 'text-neutral-400' : 'place-select-trigger-value text-neutral-900'}`}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {menuPanel}
    </div>
  );
}
