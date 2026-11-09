import { createPortal } from 'react-dom';
import { useId, useState } from 'react';
import { Check } from 'lucide-react';
import {
  EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS,
  exploreActivityDatePresetCompactLabel,
  exploreActivityDatePresetLabel,
  parseCustomActivityDateRange,
  type ExploreActivityDatePreset,
} from '../exploreActivityDateFilter';
import { UiTooltip } from '../../components/ui/UiTooltip';
import {
  EXPLORE_MAP_MOBILE_FLOAT_CHIP_GLYPH_CLASS,
  EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK,
} from '../../config/exploreTheme';
import { CalendarGlyph } from './exploreActionGlyphs';
import { ExploreMapFilterMenuShell } from './ExploreMapFilterMenuShell';
import { useExploreMapPillDropdown } from './exploreMapPillDropdown';

type ExploreMapMobileAnydayPillProps = {
  activityDatePreset: ExploreActivityDatePreset;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  pillClassName: string;
  compact?: boolean;
  wrapClassName?: string;
  /** Map float row — `w-auto` trigger (default `w-full` for legacy tray slots). */
  triggerFullWidth?: boolean;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
};

/** Anyday filter — preset list only (no separate calendar row). */
export const ExploreMapMobileAnydayPill = ({
  activityDatePreset,
  onActivityDatePresetChange,
  pillClassName,
  compact = false,
  wrapClassName = 'relative flex min-w-0 flex-1 basis-0',
  triggerFullWidth = true,
  menuOpen: menuOpenProp,
  onMenuOpenChange,
}: ExploreMapMobileAnydayPillProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = menuOpenProp ?? internalOpen;
  const setOpen = onMenuOpenChange ?? setInternalOpen;
  const panelId = useId();
  const hasCustomRange = Boolean(parseCustomActivityDateRange(activityDatePreset));
  const { anchorRef, menuRef, menuStyle, caretLeftPx } = useExploreMapPillDropdown({
    open,
    onOpenChange: setOpen,
    minWidthPx: 240,
    showCaret: true,
  });

  const label =
    activityDatePreset !== 'anyday'
      ? exploreActivityDatePresetLabel(activityDatePreset)
      : 'Anyday';
  const compactApplied = exploreActivityDatePresetCompactLabel(activityDatePreset);

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <ExploreMapFilterMenuShell
            menuRef={menuRef}
            menuStyle={menuStyle}
            caretLeftPx={caretLeftPx}
            extraListProps={{
              id: panelId,
              role: 'listbox',
              'aria-label': 'Filter outings by date',
            }}
          >
            {EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS.map((option) => {
              const selected = !hasCustomRange && option.value === activityDatePreset;
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
                    selected
                      ? 'bg-emerald-50 text-emerald-950'
                      : 'text-neutral-950 hover:bg-neutral-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {selected ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </ExploreMapFilterMenuShell>,
          document.body
        )
      : null;

  const trigger = (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        setOpen(!open);
      }}
      className={`${triggerFullWidth ? 'w-full' : 'w-auto'} ${pillClassName} ${
        open ? 'bg-white shadow-sm ring-1 ring-emerald-400/70' : ''
      }`}
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={panelId}
      aria-label={`Date: ${label}`}
    >
      {compact ? (
        <span className="inline-flex items-center gap-1" aria-hidden>
          <span className={`explore-filter-mark ${EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK}`}>
            <CalendarGlyph className={EXPLORE_MAP_MOBILE_FLOAT_CHIP_GLYPH_CLASS} />
          </span>
          {compactApplied ? (
            <span className="max-w-[5.5rem] truncate text-[12px] font-semibold leading-none">
              {compactApplied}
            </span>
          ) : null}
        </span>
      ) : (
        <>
          <span className={`explore-filter-mark ${EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK}`} aria-hidden>
            <CalendarGlyph className={EXPLORE_MAP_MOBILE_FLOAT_CHIP_GLYPH_CLASS} />
          </span>
          {label}
        </>
      )}
    </button>
  );

  return (
    <div ref={anchorRef} className={wrapClassName}>
      {compact ? (
        <UiTooltip label={`Date: ${label}`} className="flex min-w-0 flex-1">
          {trigger}
        </UiTooltip>
      ) : (
        trigger
      )}
      {menu}
    </div>
  );
};
