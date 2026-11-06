import { createPortal } from 'react-dom';
import { useEffect, useId, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS,
  encodeCustomActivityDateRange,
  exploreActivityDatePresetCompactLabel,
  exploreActivityDatePresetLabel,
  formatCustomActivityDateRangeLabel,
  parseCustomActivityDateRange,
  type ExploreActivityDatePreset,
} from '../exploreActivityDateFilter';
import { UiTooltip } from '../../components/ui/UiTooltip';
import { CalendarGlyph } from './exploreActionGlyphs';
import { ExploreMapDateRangeCalendar } from './ExploreMapDateRangeCalendar';
import { ExploreMapFilterMenuShell } from './ExploreMapFilterMenuShell';
import { useExploreMapPillDropdown } from './exploreMapPillDropdown';

type ExploreMapMobileAnydayPillProps = {
  activityDatePreset: ExploreActivityDatePreset;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  pillClassName: string;
  compact?: boolean;
  wrapClassName?: string;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
};

type MenuView = 'presets' | 'calendar';

const applyCompletedRange = (
  start: string,
  end: string,
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void,
  setOpen: (open: boolean) => void
) => {
  onActivityDatePresetChange(encodeCustomActivityDateRange(start, end));
  setOpen(false);
};

/** Anyday filter — dropdown (not a second pill row). */
export const ExploreMapMobileAnydayPill = ({
  activityDatePreset,
  onActivityDatePresetChange,
  pillClassName,
  compact = false,
  wrapClassName = 'relative flex min-w-0 flex-1 basis-0',
  menuOpen: menuOpenProp,
  onMenuOpenChange,
}: ExploreMapMobileAnydayPillProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = menuOpenProp ?? internalOpen;
  const setOpen = onMenuOpenChange ?? setInternalOpen;
  const panelId = useId();
  const appliedCustom = parseCustomActivityDateRange(activityDatePreset);
  const [view, setView] = useState<MenuView>('presets');
  const [rangeStart, setRangeStart] = useState<string | null>(appliedCustom?.from ?? null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(appliedCustom?.to ?? null);
  const { anchorRef, menuRef, menuStyle, caretLeftPx } = useExploreMapPillDropdown({
    open,
    onOpenChange: setOpen,
    minWidthPx: view === 'calendar' ? 320 : 240,
    repositionDeps: [view],
    showCaret: true,
  });

  useEffect(() => {
    if (!open) {
      setView('presets');
      return;
    }
    const next = parseCustomActivityDateRange(activityDatePreset);
    setRangeStart(next?.from ?? null);
    setRangeEnd(next?.to ?? null);
  }, [open, activityDatePreset]);

  const label =
    activityDatePreset !== 'anyday'
      ? exploreActivityDatePresetLabel(activityDatePreset)
      : 'Anyday';
  const compactApplied = exploreActivityDatePresetCompactLabel(activityDatePreset);
  const pickingEnd = Boolean(rangeStart && !rangeEnd);

  const onPickDate = (iso: string) => {
    if (!rangeStart || rangeEnd) {
      setRangeStart(iso);
      setRangeEnd(null);
      return;
    }
    if (iso < rangeStart) {
      applyCompletedRange(iso, rangeStart, onActivityDatePresetChange, setOpen);
      return;
    }
    applyCompletedRange(rangeStart, iso, onActivityDatePresetChange, setOpen);
  };

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <ExploreMapFilterMenuShell
            menuRef={menuRef}
            menuStyle={menuStyle}
            caretLeftPx={caretLeftPx}
            label="When"
            icon={<CalendarGlyph className="text-base" />}
            extraListProps={{
              id: panelId,
              role: 'listbox',
              'aria-label': 'Filter outings by when',
            }}
          >
            {view === 'presets' ? (
              <>
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
                <div className="mx-3 mt-1 border-t border-neutral-100 px-0 pb-2 pt-2">
                  <button
                    type="button"
                    role="option"
                    aria-selected={Boolean(appliedCustom)}
                    onClick={() => setView('calendar')}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                      appliedCustom
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-50 text-neutral-950 ring-1 ring-neutral-200/80 hover:bg-neutral-100'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        appliedCustom ? 'bg-white/15' : 'bg-white'
                      }`}
                    >
                      <CalendarDays className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">Calendar</span>
                      <span
                        className={`block text-[12px] font-semibold ${
                          appliedCustom ? 'text-emerald-50' : 'text-neutral-500'
                        }`}
                      >
                        {appliedCustom
                          ? formatCustomActivityDateRangeLabel(appliedCustom.from, appliedCustom.to)
                          : 'Pick a custom range'}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                  </button>
                </div>
              </>
            ) : (
              <div className="px-3 pb-3 pt-1">
                <div className="mb-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setView('presets')}
                    className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100"
                    aria-label="Back to date presets"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <p className="text-[13px] font-semibold text-neutral-950">
                    {pickingEnd ? 'Choose end date' : 'Choose start date'}
                  </p>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div
                    className={`rounded-xl px-3 py-2 ${
                      !pickingEnd ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-neutral-50'
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                      Start
                    </p>
                    <p className="text-[13px] font-semibold text-neutral-950">
                      {rangeStart ? formatCustomActivityDateRangeLabel(rangeStart, rangeStart) : 'Tap a day'}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl px-3 py-2 ${
                      pickingEnd ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-neutral-50'
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                      End
                    </p>
                    <p className="text-[13px] font-semibold text-neutral-950">
                      {rangeEnd
                        ? formatCustomActivityDateRangeLabel(rangeEnd, rangeEnd)
                        : pickingEnd
                          ? 'Tap a day'
                          : '—'}
                    </p>
                  </div>
                </div>
                <ExploreMapDateRangeCalendar
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  onPickDate={onPickDate}
                />
              </div>
            )}
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
      className={`w-full ${pillClassName} ${
        open ? 'bg-white shadow-sm ring-1 ring-emerald-400/70' : ''
      }`}
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={panelId}
      aria-label={compact ? `When: ${label}` : undefined}
    >
      {compact ? (
        <span className="inline-flex items-center gap-1" aria-hidden>
          <span className="explore-filter-mark">
            <CalendarGlyph />
          </span>
          {compactApplied ? (
            <span className="max-w-[5.5rem] truncate text-[12px] font-semibold leading-none">
              {compactApplied}
            </span>
          ) : null}
        </span>
      ) : (
        <>
          <CalendarGlyph className="text-base" />
          {label}
        </>
      )}
    </button>
  );

  return (
    <div ref={anchorRef} className={wrapClassName}>
      {compact ? (
        <UiTooltip label={`When: ${label}`} className="flex min-w-0 flex-1">
          {trigger}
        </UiTooltip>
      ) : (
        trigger
      )}
      {menu}
    </div>
  );
};
