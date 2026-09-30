import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, Check } from 'lucide-react';
import { EXPLORE_FLOATING_CONTROL } from '../../config/exploreTheme';
import {
  EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS,
  exploreActivityDatePresetLabel,
  type ExploreActivityDatePreset,
} from '../exploreActivityDateFilter';

interface ExploreMapDateFilterProps {
  activityDatePreset: ExploreActivityDatePreset;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  /** Map chrome omits “Anyday”; default state shows as “When”. */
  includeAnyday?: boolean;
  /** Browse toolbar — calendar icon only (label in aria-label / title). */
  iconOnly?: boolean;
}

/** Map date preset — Today, Tomorrow, This week, This month (optional Anyday on list). */
export const ExploreMapDateFilter = ({
  activityDatePreset,
  onActivityDatePresetChange,
  includeAnyday = true,
  iconOnly = false,
}: ExploreMapDateFilterProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const buttonLabel =
    !includeAnyday && activityDatePreset === 'anyday'
      ? 'When'
      : exploreActivityDatePresetLabel(activityDatePreset);

  const options = includeAnyday
    ? EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS
    : [
        ...EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS.filter((option) => option.value !== 'anyday'),
        { value: 'anyday' as const, label: 'Any date' },
      ];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const handleSelect = (preset: ExploreActivityDatePreset) => {
    onActivityDatePresetChange(preset);
    setOpen(false);
  };

  const active = activityDatePreset !== 'anyday';

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${EXPLORE_FLOATING_CONTROL} inline-flex h-10 items-center justify-center text-emerald-950 ${
          iconOnly ? 'w-10 shrink-0 px-0' : 'gap-1.5 px-3 text-sm font-bold leading-snug'
        } ${active ? 'ring-2 ring-emerald-500/40' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="listbox"
        aria-label={`When: ${buttonLabel}`}
        title={buttonLabel}
      >
        <CalendarDays className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
        {!iconOnly && (buttonLabel !== 'When' || active) ? (
          <span className="max-w-[6.5rem] truncate text-xs font-bold">{buttonLabel}</span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="listbox"
          aria-label="Filter outings by when"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[3100] min-w-[11.5rem]"
        >
          <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,.18)]">
            {options.map((option) => {
              const selected = option.value === activityDatePreset;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                    selected ? 'bg-emerald-50 text-emerald-950' : 'text-neutral-950 hover:bg-neutral-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {selected ? <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
