import { useEffect, useRef } from 'react';
import {
  formatTime24,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  parseTime24,
  PERIOD_OPTIONS,
  type TimePeriod,
} from '../../utils/timePicker';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  id?: string;
}

const ITEM_HEIGHT = 40;

const ScrollColumn = <T extends string | number>({
  options,
  selected,
  onSelect,
  formatOption,
}: {
  options: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  formatOption?: (value: T) => string;
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const index = options.indexOf(selected);
    if (index >= 0) {
      list.scrollTop = index * ITEM_HEIGHT;
    }
  }, [options, selected]);

  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;
    const index = Math.round(list.scrollTop / ITEM_HEIGHT);
    const next = options[Math.min(Math.max(index, 0), options.length - 1)];
    if (next !== undefined && next !== selected) {
      onSelect(next);
    }
  };

  return (
    <div className="relative h-[120px] flex-1 min-w-0">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 rounded-lg border border-emerald-200 bg-emerald-50/40" />
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollPaddingTop: ITEM_HEIGHT, scrollPaddingBottom: ITEM_HEIGHT }}
      >
        <div style={{ height: ITEM_HEIGHT }} aria-hidden />
        {options.map((option) => {
          const label = formatOption ? formatOption(option) : String(option);
          const isSelected = option === selected;
          return (
            <button
              key={String(option)}
              type="button"
              onClick={() => onSelect(option)}
              className={`w-full h-10 snap-center text-sm font-medium transition-colors ${
                isSelected ? 'text-emerald-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          );
        })}
        <div style={{ height: ITEM_HEIGHT }} aria-hidden />
      </div>
    </div>
  );
};

export const TimePicker = ({ value, onChange, required, className = '', id }: TimePickerProps) => {
  const parts = parseTime24(value || '09:00');

  const update = (patch: Partial<typeof parts>) => {
    onChange(formatTime24({ ...parts, ...patch }));
  };

  return (
    <div
      id={id}
      className={`flex items-stretch gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 ${className}`}
      aria-required={required}
    >
      <ScrollColumn
        options={HOUR_OPTIONS}
        selected={parts.hour}
        onSelect={(hour) => update({ hour })}
      />
      <span className="self-center text-gray-400 font-semibold">:</span>
      <ScrollColumn
        options={MINUTE_OPTIONS}
        selected={parts.minute}
        onSelect={(minute) => update({ minute })}
        formatOption={(minute) => String(minute).padStart(2, '0')}
      />
      <ScrollColumn
        options={PERIOD_OPTIONS}
        selected={parts.period}
        onSelect={(period) => update({ period: period as TimePeriod })}
      />
    </div>
  );
};
