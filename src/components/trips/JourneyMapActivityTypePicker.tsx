import type { MemberMapPinActivityType } from '@uaetrail/shared-types';
import { JOURNEY_MAP_ACTIVITY_OPTIONS } from '../../member-plan/journeyMapActivityTypes';

interface JourneyMapActivityTypePickerProps {
  value: MemberMapPinActivityType;
  onChange: (value: MemberMapPinActivityType) => void;
  disabled?: boolean;
}

/** Horizontally scrollable chips — 44px min touch targets on mobile. */
export const JourneyMapActivityTypePicker = ({
  value,
  onChange,
  disabled,
}: JourneyMapActivityTypePickerProps) => (
  <div>
    <p className="mb-2 text-sm font-medium text-neutral-800">What kind of outdoor moment?</p>
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide snap-x snap-mandatory">
      {JOURNEY_MAP_ACTIVITY_OPTIONS.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={`flex min-h-11 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
              selected
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-neutral-200 bg-white text-neutral-800 active:bg-neutral-50'
            } disabled:opacity-50`}
            aria-pressed={selected}
          >
            <span aria-hidden>{opt.emoji}</span>
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);
