import { useEffect } from 'react';
import {
  formatTime24,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  parseTime24,
  PERIOD_OPTIONS,
  snapMinuteToQuarter,
  type TimePeriod,
} from '../../utils/timePicker';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  id?: string;
}

const selectClass =
  'flex-1 min-w-0 h-11 bg-transparent text-center text-base font-medium text-gray-900 focus:outline-none focus:text-emerald-700 touch-manipulation cursor-pointer';

/** Compact single-row time picker — hour, minute (15 min steps), AM/PM. */
export const TimePicker = ({ value, onChange, required, className = '', id }: TimePickerProps) => {
  const parts = parseTime24(value || '09:00');
  const minute = snapMinuteToQuarter(parts.minute);

  useEffect(() => {
    if (!value) return;
    const parsed = parseTime24(value);
    const snapped = snapMinuteToQuarter(parsed.minute);
    const normalized = formatTime24({ ...parsed, minute: snapped });
    if (normalized !== value) onChange(normalized);
  }, [value, onChange]);

  const update = (patch: Partial<typeof parts>) => {
    onChange(formatTime24({ ...parts, minute, ...patch }));
  };

  return (
    <div
      id={id}
      className={`flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1 min-h-[44px] ${className}`}
      aria-required={required}
    >
      <select
        value={parts.hour}
        onChange={(e) => update({ hour: Number(e.target.value) })}
        className={selectClass}
        aria-label="Hour"
      >
        {HOUR_OPTIONS.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <span className="text-gray-400 font-semibold shrink-0">:</span>
      <select
        value={minute}
        onChange={(e) => update({ minute: Number(e.target.value) })}
        className={selectClass}
        aria-label="Minute"
      >
        {MINUTE_OPTIONS.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, '0')}
          </option>
        ))}
      </select>
      <select
        value={parts.period}
        onChange={(e) => update({ period: e.target.value as TimePeriod })}
        className={`${selectClass} max-w-[4.5rem]`}
        aria-label="AM or PM"
      >
        {PERIOD_OPTIONS.map((period) => (
          <option key={period} value={period}>
            {period}
          </option>
        ))}
      </select>
    </div>
  );
};
