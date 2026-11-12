import { createPortal } from 'react-dom';
import { useId, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { ExploreMapFilterMenuShell } from './ExploreMapFilterMenuShell';
import { useExploreMapPillDropdown } from './exploreMapPillDropdown';

type ExploreFilterDropdownOption = {
  key: string;
  label: string;
  indent?: boolean;
};

type ExploreFilterDropdownPillProps = {
  label: string;
  ariaLabel: string;
  active: boolean;
  options: readonly ExploreFilterDropdownOption[];
  selectedKeys: readonly string[];
  onSelect: (key: string) => void;
  onClear?: () => void;
  icon: ReactNode;
  pillClassName: string;
  wrapClassName?: string;
  multi?: boolean;
  menuLabel?: string;
  extra?: ReactNode;
};

export const ExploreFilterDropdownPill = ({
  label,
  ariaLabel,
  active,
  options,
  selectedKeys,
  onSelect,
  onClear,
  icon,
  pillClassName,
  wrapClassName = 'relative flex shrink-0 items-center justify-center',
  multi = false,
  menuLabel,
  extra,
}: ExploreFilterDropdownPillProps) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { anchorRef, menuRef, menuStyle, caretLeftPx } = useExploreMapPillDropdown({
    open,
    onOpenChange: setOpen,
    minWidthPx: 220,
    showCaret: true,
  });

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <ExploreMapFilterMenuShell
            menuRef={menuRef}
            menuStyle={menuStyle}
            caretLeftPx={caretLeftPx}
            label={menuLabel}
            extraListProps={{
              id: panelId,
              role: 'listbox',
              'aria-label': ariaLabel,
              ...(multi ? { 'aria-multiselectable': 'true' as const } : {}),
            }}
          >
            {multi && onClear && selectedKeys.length > 0 ? (
              <div className="flex items-center justify-end px-3.5 pb-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => onClear()}
                  className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  All
                </button>
              </div>
            ) : null}
            {options.map((option) => {
              const selected = selectedKeys.includes(option.key);
              return (
                <button
                  key={option.key}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onSelect(option.key);
                    if (!multi) setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    option.indent ? 'pl-7 pr-3.5' : 'px-3.5'
                  } ${selected ? 'bg-emerald-50 text-emerald-950' : 'text-neutral-950 hover:bg-neutral-50'}`}
                >
                  <span>{option.label}</span>
                  {selected ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
                  ) : null}
                </button>
              );
            })}
            {extra}
          </ExploreMapFilterMenuShell>,
          document.body
        )
      : null;

  return (
    <div ref={anchorRef} className={wrapClassName}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(!open);
        }}
        className={`w-auto ${pillClassName} ${open ? 'bg-white shadow-sm ring-1 ring-emerald-400/70' : ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={panelId}
        aria-label={ariaLabel}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {icon}
          <span className="max-w-[9.5rem] truncate">{label}</span>
        </span>
      </button>
      {menu}
    </div>
  );
};
