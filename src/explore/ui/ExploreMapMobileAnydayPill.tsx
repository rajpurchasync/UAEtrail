import { createPortal } from 'react-dom';
import { useId, useState } from 'react';
import { Check } from 'lucide-react';
import {
  EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS,
  exploreActivityDatePresetLabel,
  type ExploreActivityDatePreset,
} from '../exploreActivityDateFilter';
import { EXPLORE_COMPACT_PILL_LABEL } from '../../config/exploreTheme';
import { useExploreMapPillDropdown } from './exploreMapPillDropdown';

type ExploreMapMobileAnydayPillProps = {
  activityDatePreset: ExploreActivityDatePreset;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  pillClassName: string;
  compact?: boolean;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
};

/** Anyday filter — dropdown (not a second pill row). */
export const ExploreMapMobileAnydayPill = ({
  activityDatePreset,
  onActivityDatePresetChange,
  pillClassName,
  compact = false,
  menuOpen: menuOpenProp,
  onMenuOpenChange,
}: ExploreMapMobileAnydayPillProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = menuOpenProp ?? internalOpen;
  const setOpen = onMenuOpenChange ?? setInternalOpen;
  const panelId = useId();
  const { anchorRef, menuRef, menuStyle } = useExploreMapPillDropdown({
    open,
    onOpenChange: setOpen,
  });

  const label =
    activityDatePreset !== 'anyday'
      ? exploreActivityDatePresetLabel(activityDatePreset)
      : 'Anyday';

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            id={panelId}
            role="listbox"
            aria-label="Filter outings by when"
            style={menuStyle}
            className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,.18)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS.map((option) => {
              const selected = option.value === activityDatePreset;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onActivityDatePresetChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                    selected ? 'bg-emerald-50 text-emerald-950' : 'text-neutral-950 hover:bg-neutral-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {selected ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={anchorRef} className="relative flex min-w-0 flex-1 basis-0">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(!open);
        }}
        className={`w-full ${pillClassName}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={panelId}
      >
        {compact ? (
          <>
            <span className="text-sm leading-none" aria-hidden>📅</span>
            <span className={EXPLORE_COMPACT_PILL_LABEL}>{label}</span>
          </>
        ) : (
          <>
            <span className="text-base leading-none" aria-hidden>📅</span>
            {label}
          </>
        )}
      </button>
      {menu}
    </div>
  );
};
